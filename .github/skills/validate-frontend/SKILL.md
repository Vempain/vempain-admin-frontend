---
name: validate-frontend
description: Install, lint, test and build the admin frontend with the checked-in Yarn 4 and GitHub Packages access, keeping generated files out of the diff. Use before reporting any change as done.
---

# Validate vempain-admin-frontend

- Checked-in Yarn 4 (`yarnPath` in `.yarnrc.yml`); `@vempain/*` packages need `VEMPAIN_ACTION_TOKEN` (GitHub PAT with `read:packages`)
  for `yarn install --immutable`. Restore `package.json` and `.yarn/install-state.gz` if Yarn rewrites them.
- Run and keep clean:
  ```bash
  yarn lint
  yarn test
  yarn build
  ```
- `generateBuildInfo.js` rewrites `src/buildInfo.json` during the build; it is a derived artifact, do not commit the change. Never commit
  `dist/`, `coverage/`, `node_modules/`, `.env.local`, `.env.prod`, `.env.stage`, `.env.combined`.
- Jest: config in `jest.config.js`, setup `src/setupTests.ts`, tests only in `src/__tests__/`; screens using `useTaskProgress` mock
  `@vempain/vempain-common-frontend`. Run one file with `yarn jest src/__tests__/<file>`.
- Security relevant changes (sanitization, URL building, authentication) are recorded in `security/OWASP-2025-audit-report.md`.
- CI is `frontend-spa.yaml` from `vempain-workflows` (tests on PRs, Docker image on `main`). Report the numbers from the output.
