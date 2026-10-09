# vempain-admin-frontend — Agent Guide

## Scope

- React 19 + TypeScript + Ant Design 6 single-page app (Vite) for content administration. It talks to `vempain-admin-backend` (`VITE_APP_API_URL`,
  `/api` on the backend) and embeds the rich-text editor from `@vempain/vempain-rt-editor`.
- Authentication, session handling and the base API client come from `@vempain/vempain-auth-frontend`; this repo must not reimplement them.

## Layout

| Path                                         | Purpose                                                                                              |
|----------------------------------------------|------------------------------------------------------------------------------------------------------|
| `src/App.tsx`                                | Router: `/login`, `/logout`, and protected routes under `ProtectedRoute`                             |
| `src/main/`                                  | `TopBar`, `BottomFooter`, `Home`, `ProtectedRoute`, `MetadataForm`, `SubmitResultHandler`            |
| `src/content/`                               | Components, forms, layouts, pages (list/edit/delete/publish/view)                                    |
| `src/file/`                                  | Galleries and site files                                                                             |
| `src/schedule/`, `src/user/`, `src/website/` | Schedules, users/units, website configuration/users/data publish                                     |
| `src/services/`                              | One `*API.ts` per backend resource, each `extends AbstractAPI` from the auth library                 |
| `src/models/`                                | TS models (`Requests/`, `Responses/`, `*Enum.ts` as `as const` objects)                              |
| `src/tools/`                                 | Pure helpers (time, numbers, embed tags, URL/rich-text/footer security)                              |
| `src/__tests__/`                             | Jest tests (`*.test.ts(x)`); screens using `useTaskProgress` mock `@vempain/vempain-common-frontend` |
| `__mocks__/`                                 | Jest mocks for assets/styles                                                                         |

## Conventions

- Services: `class XxxAPI extends AbstractAPI<Request, Response>`, exported as a singleton created with `import.meta.env.VITE_APP_API_URL` and the
  backend prefix (`/content-management/...`, `/admin-management/...`, `/schedule-management/...`). Call `this.setAuthorizationHeader()` before requests.
- JSON contracts are snake_case end to end; TS models mirror the backend DTO field names. Never rename fields to camelCase ad hoc.
- Do not add TypeScript `enum`; use `as const` objects plus a derived type (see `src/models/FileTypeEnum.ts`).
- Route changes must be reflected in both `src/App.tsx` and `src/main/TopBar.tsx`.
- `PageEditor.tsx`: the path field is `PagePathInput` (`AutoComplete` fed by `pageAPI.suggestPath`, debounced; the backend answers with the
  parent path shared by the readable pages whose path starts with the typed text, never a full existing path), and a new page starts
  with one ACL row granting the signed-in user every privilege (`useSession().userSession.id`).
- `src/administration/ApiTokens.tsx` (`/administration/api-tokens`, menu "Web Site Management > API tokens") manages the
  service-to-service API tokens of the admin backend through `apiTokenAPI` (`/admin-management/api-tokens`): list, create (description,
  IPv4/IPv6 network pre-filled from `apiTokenAPI.defaultNetwork()` (the admin backend's own private network when the deployment declares
  `vempain.admin.api-token.private-network`, with every attached private network offered as an alternative; otherwise entered by hand), validated client-side by
  `isValidNetwork` (`src/tools/networkTools.ts`) and again by the backend, future expiry) and delete. The token string is
  shown in a modal exactly once after creation; the list only shows the prefix. Tested in `src/__tests__/ApiTokens.test.tsx`.
- `src/main/MetadataForm.tsx` is the read-only audit trail (created by / created / modified by / modified) of every editor: a compact
  antd `Descriptions` line, never inputs. It resolves user ids to "name (login)" through `resolveUserName` (`src/tools/userNames.ts`, `userAPI.findById` with a
  session cache) and
  shows the raw id and exact timestamp on hover. The user and unit editors keep the audit fields as hidden form items so that their
  submitted payload is unchanged. Tested in `src/__tests__/MetadataForm.test.tsx`.
- User and unit management (`src/user/*`) and the ACL editor are the shared screens of `@vempain/vempain-auth-frontend` (`UserList`,
  `UserEditor`, `UnitList`, `UnitEditor`, `AclEditor`) bound to this backend's `userAPI`/`unitAPI` (`src/services/UserAPI.ts`,
  `UnitAPI.ts`, instances of the library's `UserAPI`/`UnitAPI` on `/content-management/users|units`). `src/content/AclEdit.tsx` is only
  the wrapper that loads this backend's users and units for the shared `AclEditor`; the editors keep its `acls`/`parentForm` contract.
  The ACL rules (create implies read, "All" button) and the nested-unit cycle check live and are tested in the library; here
  `src/__tests__/AclEdit.test.tsx` covers the wrapper and `src/__tests__/PagePathInput.test.tsx` the path input.
- Editor integration: `PageEditor.tsx` and `PagePublish.tsx` are the reference host for `RichTextEditor` and its `dataProviders`; keep them aligned
  with the rt-editor integration guide.
- Rich-text/HTML from the backend is sanitized with the helpers in `src/tools/` (`richTextSecurity`, `urlSecurity`, `footerSecurity`); do not bypass them.
- Tests live in `src/__tests__/` (mirror the `src/` structure for new subfolders); Jest setup is `src/setupTests.ts`, config in `jest.config.js`.
- Build metadata is generated by `generateBuildInfo.js` into `src/buildInfo.json`; treat the JSON as a derived artifact.
- Long-running backend actions (page and gallery publishing, publish-all, publish-selected, refresh-all gallery files, data set
  publishing) run as background tasks: the backend answers `202` with a `TaskAcceptedResponse` (`PublishResponse.task`,
  `RefreshResponse.task`, or a bare task for `dataAPI.publishDataSet`). Never show a blocking spinner for them: pass the task to
  `trackTask(task, {onFinished})` from `useTaskProgress()` of `@vempain/vempain-common-frontend` and tell the user the work started.
  `src/services/TaskAPI.ts` creates `taskAPI`, `App.tsx` mounts `<TaskProgressProvider taskAPI={taskAPI}>` and `<TaskProgressTray/>`, and
  the tray texts are the `TaskProgress.*` keys in `src/i18n.ts`. A scheduled publish still answers `200` without a task.
- `.env` is the template; `.env.local`, `.env.prod`, `.env.stage`, `.env.combined` are local/deployment files and must not receive secrets.

## Tooling and validation

- Use the checked-in Yarn 4 release (`.yarn/releases`, `yarnPath` in `.yarnrc.yml`); `@vempain/*` packages resolve from GitHub Packages with
  `VEMPAIN_ACTION_TOKEN`.
- Run after changes:

```bash
yarn lint
yarn test
yarn build
```

- CI uses the reusable `frontend-spa.yaml` workflow from `vempain-workflows` (tests on PRs, Docker image on `main`).
- Do not commit `dist/`, `coverage/`, `node_modules/` or local environment files.
- Security findings and their mitigations are recorded in `security/OWASP-2025-audit-report.md`; keep it current when changing sanitization,
  URL building or authentication handling.

## Tag ACL rule

Tags are metadata, not ACL-bearing resources. Tag entities have no ACL information, so tag list, search, and mutation endpoints must not perform ACL checks on
tags. ACL checks apply only to resources that explicitly carry an ACL.
