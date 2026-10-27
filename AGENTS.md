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
- Route changes must be reflected in both `src/App.tsx` and `src/main/TopBar.tsx`. The top bar's last dropdown is `System Management`
  (users, units and the Statistics screen); there is no separate user management menu any more.
- Page tags: `PageEditor` has a `tags` field (`Select mode="tags"`, comma or Enter separates them) saved as `PageRequest.tags` and shown as
  `PageResponse.tags`; `PageList` renders them in a Tags column. Tested in `src/__tests__/content/PageEditor.test.tsx` and
  `src/__tests__/content/PageList.test.tsx`.
- `src/website/TagBlacklist.tsx` (`/administration/tag-blacklist`, Web Site Management > Tag blacklist) manages the tags that are never
  published to the website through `tagBlacklistAPI` (`GET|POST|DELETE /admin-management/tag-blacklist`, models `TagBlacklistRequest`/
  `TagBlacklistResponse`): an inline add form, the table with who added each tag and a confirmed remove. Tested in
  `src/__tests__/website/TagBlacklist.test.tsx` and `src/__tests__/main/TopBar.test.tsx`.
- `src/administration/Statistics.tsx` (`/administration/statistics`) renders `GET /admin-management/statistics` (`statisticsAPI`,
  `AdminStatisticsResponse` in `src/models/Responses`): resource totals, site files by type, published/not published, created and published
  per month, resources per user with the per-type sub table, pages by form, forms by layout and component, pages and site files by path. Charts
  come from `@ant-design/charts` (`Column`, `Line`, mocked in tests); resource type labels live in `src/tools/statisticsTools.ts`. Tested in
  `src/__tests__/Statistics.test.tsx` and `src/__tests__/main/TopBar.test.tsx`.
- `PageEditor.tsx`: the path field is `PagePathInput` (`AutoComplete` fed by `pageAPI.suggestPath`, debounced; the backend answers with the
  parent path shared by the readable pages whose path starts with the typed text, never a full existing path), and a new page starts
  with one ACL row granting the signed-in user every privilege (`useSession().userSession.id`).
- `src/administration/ApiTokens.tsx` (`/administration/api-tokens`, menu "Web Site Management > API tokens") manages the
  service-to-service API tokens of the admin backend through `apiTokenAPI` (`/admin-management/api-tokens`): list, create (description,
  IPv4/IPv6 network pre-filled from `apiTokenAPI.defaultNetwork()` (the admin backend's own private network when the deployment declares
  `vempain.admin.api-token.private-network`, with every attached private network offered as an alternative; otherwise entered by hand), validated client-side by
  `isValidNetwork` (`src/tools/networkTools.ts`) and again by the backend, future expiry) and delete. The token string is
  shown in a modal exactly once after creation; the list only shows the prefix. Tested in `src/__tests__/ApiTokens.test.tsx`.
- Every resource that is released to the website carries `published` (snake_case, `null` = never released): `PageResponse`,
  `GalleryResponse`/`FileGroupListResponse` (`Dayjs | null`, like the other audit timestamps of `AbstractResponse`), `SiteFileResponse`
  and `DataSummaryResponse`/`DataResponse` (ISO strings). The lists show it as a column: `PageList` and `GalleryList` ("Published",
  server-sorted by `published`), `SiteFileList` ("Published", with milliseconds like the other file timestamps) and
  `WebSiteDataPublish` ("Released"); a never-released row reads "Not published" / "Not released". It is read-only and never sent in a
  request. Tested in `src/__tests__/file/GalleryList.test.tsx`, `src/__tests__/file/galleryScreens.test.tsx` and
  `src/__tests__/WebSiteDataPublish.test.tsx`.
- Every one of those lists has the "Only modified after publish" filter (`src/main/ReleaseFilterSwitch.tsx`, an antd `Switch` with that
  accessible name): on, only the resources whose website copy is outdated are shown, i.e. released once and modified after that
  release (`published` and `modified` both set, `published < modified`). The server-paged lists send it as `modified_after_publish`
  (`PagePagedRequest`, `GalleryPagedRequest`, `SiteFilePagedRequest`; `GenericFileList` owns the switch for the typed site file lists)
  and the backend filters; `WebSiteDataPublish` filters its loaded data sets client-side with `isModifiedAfterPublish`
  (`src/tools/releaseTools.ts`, `updated_at` is the data set's modification time). Keep the rule in that helper and in the backend's
  `ReleaseState` identical. Tested in `src/__tests__/tools/releaseTools.test.ts` and the list tests above plus
  `src/__tests__/content/PageList.test.tsx`.
- `src/website/WebSiteConfiguration.tsx` shows the audit trail of each site configuration row ("Modified by"/"Modified" from
  `WebSiteConfigurationResponse.modifier`/`modified`, the admin user's nick and the time of the last update; a dash when never
  updated, `creator`/`created` are null for the seeded rows). Tested in `src/__tests__/website/WebSiteConfiguration.test.tsx`.
- `src/main/MetadataForm.tsx` is the read-only audit trail (created by / created / modified by / modified) of every editor: a compact
  antd `Descriptions` line, never inputs. It resolves user ids to "name (login)" through `resolveUserName` (`src/tools/userNames.ts`, `userAPI.findById` with a
  session cache) and
  shows the raw id and exact timestamp on hover. The user and unit editors keep the audit fields as hidden form items so that their
  submitted payload is unchanged. Tested in `src/__tests__/MetadataForm.test.tsx`.
- User and unit management (`src/user/*`) and the ACL editor are the shared screens of `@vempain/vempain-auth-frontend` (`UserList`,
  `UserEditor`, `UnitList`, `UnitEditor`, `AclEditor`) bound to this backend's `userAPI`/`unitAPI` (`src/services/UserAPI.ts`,
  `UnitAPI.ts`, instances of the library's `UserAPI`/`UnitAPI` on `/content-management/users|units`). `src/content/AclEdit.tsx` is only
  the wrapper that loads this backend's users and units for the shared `AclEditor` (the `AclVO` adapter of the library's `AclRowsEditor`,
  the one ACL row editor of all Vempain frontends); the content editors (page, form, layout, component, gallery) keep its
  `acls`/`parentForm` contract. The ACL row rules (either a user or a unit, read required, delete needs modify, create implies read,
  "All" button) and the nested-unit cycle check live and are tested in the auth library, never in a local copy here; here
  `src/__tests__/AclEdit.test.tsx` covers the wrapper with the library editor stubbed and `src/__tests__/PagePathInput.test.tsx` the path input.
  Any new shared ACL component, rule or helper this SPA needs is added to `@vempain/vempain-auth-frontend` (the home of all shared ACL
  functionality) and consumed from there, never written here or in `vempain-common-frontend`.
- Editor integration: `PageEditor.tsx` and `PagePublish.tsx` are the reference host for `RichTextEditor` and its `dataProviders`; keep them aligned
  with the rt-editor integration guide. The `findInternalLinks` provider answers the editor's link dialog with the published pages and files
  of the website (`webSiteManagementAPI.findInternalLinks` -> `GET /admin-management/site/links`), mapped by `tools/internalLinkTools.ts` to the
  website's routes (`/pages/<path>`, `/file/<path>`, every segment URL-encoded); the website route prefixes live only there.
- Page-gallery links are derived from the body, never edited by hand: `PageEditor.tsx` passes `onEmbedsChange` to the editor,
  `galleryIdsFromEmbeds` (`src/tools/pageGalleryTools.ts`) keeps the ids of the `gallery` embeds and the hero `carousel` embeds in body
  order, the editor shows them as a read-only "Galleries" summary (names via `galleryAPI.findById`), and the page save sends them as
  `gallery_ids` (`PageRequest`, `pageAPI.create/update`). The backend replaces the links in the same transaction and publishes those
  galleries with the page; there is no separate page-gallery endpoint any more (`PagePublish.tsx` still lists the saved links through
  `galleryAPI.findListByPage`). Tested in `src/__tests__/pageGalleryTools.test.ts`.
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
