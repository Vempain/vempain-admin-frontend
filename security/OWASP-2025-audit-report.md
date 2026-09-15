# OWASP Top 10:2025 Audit — Vempain Admin Frontend

Date: 2026-09-15 · Scope: frontend, frontend container, and frontend CI · Method: static review plus local regression tests

## Executive summary

The audit found two exploitable stored-content HTML/URL injection paths and three medium hardening gaps.
All identified frontend CRITICAL/HIGH findings were fixed at the browser trust boundary. Rich-text content is now
sanitized before it reaches the third-party editor and before it is sent back to the API, and preview iframes only
accept canonical HTTPS YouTube URLs. CI now uses read-only permissions and a pinned reusable workflow revision.
Backend authorization and server-side CMS sanitization remain required controls outside this frontend-only change.

## Asset and trust-boundary inventory

- Browser → Admin API: Axios services under `src/services/`, authenticated by the shared auth package/local bearer header.
- Browser-rendered content: page body and embed descriptors in `src/content/PageView.tsx`; editable page body in
  `src/content/PageEditor.tsx` and publish preview in `src/content/PagePublish.tsx`.
- Browser → file service: numeric file IDs rendered through the configured `VITE_APP_FILE_URL`.
- Build/deploy: Vite bundles `VITE_*` values; `.github/workflows/ci.yaml` calls the shared workflow; `Dockerfile`
  serves `dist/` with nginx.
- Sensitive data: bearer token managed by the shared auth package and page/user/site administration data returned by
  the Admin API. No new secret was introduced.

## Coverage matrix

| Category                             | Checked | Findings (C/H/M/L) | Status                                                                                 |
|--------------------------------------|---------|-------------------:|----------------------------------------------------------------------------------------|
| A01 Broken Access Control            | yes     |            0/0/0/0 | Backend boundary required; frontend routes are not treated as authorization            |
| A02 Security Misconfiguration        | yes     |            0/0/1/0 | Fixed headers, explicit no-source-map build; container base/runtime items deferred     |
| A03 Software Supply Chain Failures   | yes     |            0/0/1/0 | Fixed CI permissions and workflow pin; SCA unavailable without private registry auth   |
| A04 Cryptographic Failures           | yes     |            0/0/0/0 | Shared auth boundary; no frontend cryptographic implementation found                   |
| A05 Injection                        | yes     |            0/2/0/0 | Fixed rich-text placeholder XSS and arbitrary iframe URL                               |
| A06 Insecure Design                  | yes     |            0/0/0/0 | Backend must enforce authorization, limits, and state transitions                      |
| A07 Authentication Failures          | yes     |            0/0/0/0 | Shared auth/backend scope; MFA/rate limiting cannot be verified here                   |
| A08 Software/Data Integrity Failures | yes     |            0/0/0/0 | No unpinned third-party runtime script; CI workflow is now pinned                      |
| A09 Logging & Alerting Failures      | yes     |            0/0/0/0 | Frontend logs contain no token/password logging; backend audit logging is out of scope |
| A10 Exceptional Conditions           | yes     |            0/0/0/0 | Malformed embed item shapes now fail closed; API error handling remains backend-owned  |

## Findings

### [HIGH] F-01 — Stored XSS through rich-text embed placeholders · A05:2025 · CWE-79

- **Location:** `src/content/PageEditor.tsx:253,293`, `src/content/PagePublish.tsx:69`,
  `src/tools/richTextSecurity.ts:64-73`, dependency `@vempain/vempain-rt-editor` placeholder conversion.
- **Description:** API page bodies were passed directly to an editor that converts embed comments into
  `innerHTML`; untrusted embed values could become HTML in a placeholder label. Parsed JSON embed items were also
  trusted as their declared TypeScript type.
- **Impact:** A page author or compromised API response could execute script in another administrator's browser when
  the page was edited or previewed.
- **Reproduction:** A body containing an embed value such as
  `<!--vps:embed:youtube:<img src=x onerror=alert(1)>-->` reached the editor placeholder HTML.
- **Fix applied:** Added `sanitizeRichText`, strict fragment sanitization, runtime item-shape validation, URL and
  identifier allow-lists, and canonical embed reconstruction. Both editor input and outgoing page saves use it.
- **Verification:** `src/__tests__/securityTools.test.ts` (`sanitizes rich text...`,
  `rejects malformed embed item shapes...`); `yarn test --runInBand`.
- **Residual risk:** CMS/API consumers must sanitize page HTML server-side as well.

### [HIGH] F-02 — Arbitrary URL accepted by preview iframe · A05:2025 · CWE-79/CWE-20

- **Location:** `src/tools/urlSecurity.ts:8-36`, consumed by `src/content/PageView.tsx:138-151`.
- **Description:** The previous normalizer returned the original value when parsing failed or when the host was not
  YouTube, and accepted arbitrary YouTube subdomains. The value was used as an iframe `src`.
- **Impact:** A crafted stored embed could load attacker-controlled content, including script-capable schemes in
  browsers that permit them in iframe navigation, in an authenticated admin origin.
- **Reproduction:** A `youtube` embed with `javascript:...` or `https://attacker.youtube.com/...` was rendered as an
  iframe source.
- **Fix applied:** Require HTTPS, exact YouTube host allow-list, validated video IDs, canonical embed URL output,
  invalid-URL fallback text, and iframe sandboxing.
- **Verification:** `src/__tests__/securityTools.test.ts` (`only accepts canonical HTTPS YouTube URLs`); full Jest
  suite and production build pass.

### [MEDIUM] F-03 — Footer HTML sink from build-time configuration · A05:2025 · CWE-79

- **Location:** `src/main/BottomFooter.tsx:9-19`, `src/tools/footerSecurity.ts:3-10`.
- **Description:** Public `VITE_*` configuration was inserted into `dangerouslySetInnerHTML` without an allow-list.
- **Fix applied:** `sanitizeFooterMarkup` permits only `a` and `br`, permits only `href`, and rejects unsafe URL
  protocols before rendering.
- **Verification:** `securityTools.test.ts` (`sanitizes footer markup...`).

### [MEDIUM] F-04 — Mutable CI supply-chain boundary and excessive token permissions · A03:2025 · CWE-829/CWE-732

- **Location:** `.github/workflows/ci.yaml:3-20`.
- **Description:** The reusable workflow used floating `@main` and the job granted `contents: write` and
  `packages: write`.
- **Fix applied:** Pinned the workflow to commit
  `0848b3a6caa6d94d0c49519f849660ae9288865f` and reduced permissions to read-only.
- **Verification:** Static diff review; immutable install was already enabled.

### [MEDIUM] F-05 — Missing browser response hardening and implicit source-map policy · A02:2025 · CWE-16

- **Location:** `Dockerfile:5-17`, `vite.config.ts:17-20`.
- **Description:** nginx emitted no application security headers and production source-map behavior was implicit.
- **Fix applied:** Added CSP, frame, referrer, permissions, MIME-sniffing, and server-version hardening headers;
  explicitly disabled Vite production source maps.
- **Verification:** Docker configuration review and production build pass.

## Checklist verdicts

- **A01:** PASS for frontend not making authorization decisions; backend authorization, object ownership, CSRF/CORS,
  rate limits, and management endpoints are UNVERIFIED in this frontend-only scope.
- **A02:** PASS for explicit Vite source-map policy and nginx response headers; DEFERRED for pinned nginx digest,
  non-root container execution, and deployment TLS/HSTS because deployment ownership is outside this repo.
- **A03:** PASS for committed Yarn lockfile, immutable-install CI input, HTTPS registries, and pinned reusable workflow;
  UNVERIFIED for transitive SCA/SBOM because `yarn npm audit --all --recursive` could not authenticate to the private
  GitHub Packages registry.
- **A04:** N/A for password storage, JWT signing, transport clients, and key management; these are shared auth/backend
  responsibilities.
- **A05:** PASS for all local HTML sinks after the fixes; backend-side HTML sanitization remains required.
- **A06:** UNVERIFIED for server-side quotas, state machines, tenant segregation, and anti-automation.
- **A07:** UNVERIFIED for brute-force controls, MFA, token lifetime/revocation, and password recovery; shared auth and
  backend are required to prove these.
- **A08:** PASS for no CDN scripts and pinned CI workflow; UNVERIFIED for backend deserialization and artifact signing.
- **A09:** UNVERIFIED for centralized security audit logging and alerting; browser console errors do not constitute an
  audit trail.
- **A10:** PASS for malformed embed data failing closed and generic UI error messages; UNVERIFIED for API transaction
  and exception handling.

## Accepted risks and deferred items

| Item                                     | Category | Why deferred                                                                         | Proposed owner/date                              |
|------------------------------------------|----------|--------------------------------------------------------------------------------------|--------------------------------------------------|
| Server-side page HTML sanitization       | A05      | Backend was explicitly out of scope; client filtering cannot protect other consumers | Admin backend owner / next security iteration    |
| Dependency SCA/SBOM                      | A03      | Existing private registry authentication was unavailable in this environment         | CI owner / next CI maintenance                   |
| nginx digest, non-root runtime, TLS/HSTS | A02      | Requires deployment/image compatibility validation                                   | Operations owner / next container hardening pass |
| MFA, rate limiting, token revocation     | A07      | Implemented in shared auth/backend, not this repository                              | Auth owner / roadmap                             |

## Verification

- `yarn test --runInBand`: 66 tests passed across 5 suites.
- `yarn lint`: passed with zero warnings.
- `yarn tsc -p tsconfig.app.json --noEmit`: passed.
- `yarn build`: passed; Vite emitted only its existing chunk-size warning.
- `yarn npm audit --all --recursive`: not completed because the private registry returned `YN0041 Invalid authentication`.
