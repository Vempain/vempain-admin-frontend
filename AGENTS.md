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

- Every table is the shared `VempainTable` of `@vempain/vempain-auth-frontend` (`ApiTokens` and `TagBlacklist` included), never a raw Ant
  Design `Table`, and no screen passes `scroll={{x: ...}}`: a horizontally scrolling table is sized by its content and grew past the
  viewport (the library drops `scroll.x` anyway). The table fits its container by moving columns into the expandable row, so screens rank
  their columns with `priority` and give action columns a `width`.

## Conventions

- Services: `class XxxAPI extends AbstractAPI<Request, Response>`, exported as a singleton created with `import.meta.env.VITE_APP_API_URL` and the
  backend prefix (`/content-management/...`, `/admin-management/...`, `/schedule-management/...`). Call `this.setAuthorizationHeader()` before requests.
- JSON contracts are snake_case end to end; TS models mirror the backend DTO field names. Never rename fields to camelCase ad hoc.
- Do not add TypeScript `enum`; use `as const` objects plus a derived type (see `src/models/FileTypeEnum.ts`).
- Route changes must be reflected in both `src/App.tsx` and `src/main/TopBar.tsx`. The top bar's last dropdown is `System Management`
  (users, units and the Statistics screen); there is no separate user management menu any more.
- Page tags: `PageEditor` has a `tags` field (`PageTagsInput`, a `Select mode="tags"`; comma or Enter separates them) saved as
  `PageRequest.tags` and shown as `PageResponse.tags`; `PageList` renders them in a Tags column. The suggestions come from `tagAPI.search`
  (`GET /content-management/tags?search=&limit=`, `TagResponse` = `id` + `tag_name`, debounced like `PagePathInput`, the first tags when the
  field opens): the admin backend's tags, which are the tags of the published files (sent by the file backend with every publish) and of the
  pages. The admin SPA never calls the file backend for tags; a new tag typed here becomes an admin tag when the page is saved. Tested in
  `src/__tests__/content/PageTagsInput.test.tsx`, `src/__tests__/content/PageEditor.test.tsx` and `src/__tests__/content/PageList.test.tsx`.
- `src/website/TagBlacklist.tsx` (`/administration/tag-blacklist`, Web Site Management > Tag blacklist) manages the tags that are never
  published to the website through `tagBlacklistAPI` (`GET|POST|DELETE /admin-management/tag-blacklist`, models `TagBlacklistRequest`/
  `TagBlacklistResponse`): an inline add form, the table with who added each tag and a confirmed remove. Tested in
  `src/__tests__/website/TagBlacklist.test.tsx` and `src/__tests__/main/TopBar.test.tsx`.
- `src/administration/Statistics.tsx` (`/administration/statistics`) renders `GET /admin-management/statistics` (`statisticsAPI`,
  `AdminStatisticsResponse` in `src/models/Responses`): resource totals, site files by type, published/not published, created and published
  per month, resources per user with the per-type sub table, pages by form, forms by layout and component, pages and site files by path. Charts
  come from `@ant-design/charts` (`Column`, `Line`, mocked in tests); resource type labels live in `src/tools/statisticsTools.ts`. Tested in
  `src/__tests__/Statistics.test.tsx` and `src/__tests__/main/TopBar.test.tsx`.
- `PageEditor.tsx` and `src/file/GalleryEdit.tsx` save through a `SplitActionButton` of `@vempain/vempain-common-frontend`
  (`htmlType="submit"`, the selected key in the editor's `saveAction` state): "Save page" / "Create" / "Update" save as before, the
  "... and publish" action saves and then publishes the saved page or gallery at once
  (`pageAPI.publish` / `galleryAPI.publish` with the created or edited id, no schedule, no message) and hands the 202 task to
  `useTaskProgress().trackTask`;
  a failed publish is reported next to the successful save, the page is not rolled back. Picking an action in the menu only changes the
  label, the main part runs it. The Jest stub of the library (`__mocks__/@vempain/vempain-common-frontend.tsx`) renders one button per
  action (`<testid>-option-<key>`) and the main part (`<testid>-main`); keep it aligned with the library's props.
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
- Data sets are ACL-bearing resources of the admin backend (its `V1011`): `DataSummaryResponse`/`DataResponse` carry `acl_id`, `acls`
  (`AclVO[]`), `locked`, `creator`, `created`, `modifier` and `modified` (ISO strings; the former `created_at`/`updated_at` are gone) and
  `WebSiteDataPublish` shows them as the "ACL", "Creator" (`UserName` of the auth library through `userAPI`), "Created", "Modifier" and
  "Modified" columns next to "Generated" and "Released". The grantees are entered on the file SPA side when the set is created; this SPA
  only shows them. The screen is one `VempainTable` in server mode over `usePagedTable` (`dataAPI.findPageableDataSets`, default sort
  `identifier` ascending, 25 rows): every column sorts on the backend, identifier/type/description carry the column text filter
  (`filter_column`), the other columns are `searchable: false`; the former client-side music/GPS keyword sections are gone, the unpaged
  `dataAPI.getAllDataSets` stays for the GPS embed discovery of the page editor. Tested in `src/__tests__/WebSiteDataPublish.test.tsx`.
- `SiteFileMap` (`src/file/SiteFileMap.tsx`, route `/map`, menu File Management > Map) is the map of the published site files with GPS
  coordinates: the `MapView` of `@vempain/vempain-common-frontend` over `mapAPI` (`src/services/MapAPI.ts`, the admin backend's `MapAPI`
  endpoints at `/map`, which cluster the readable site files on the backend), the tile server of `src/tools/mapConfig.ts`
  (`VITE_MAP_TILE_URL`/`VITE_MAP_ATTRIBUTION`, OpenStreetMap by default), tag suggestions through `tagAPI.search`, the thumbnail through
  `SiteFileThumbnail` (`siteFileAPI.getThumbnail`, `GET /content-management/file/site-files/{id}/thumbnail` as a blob, the only file content
  this SPA fetches) and the details as a `Descriptions` (`SiteFileMapDetails`, coordinates as value + hemisphere). `leaflet`/`react-leaflet`
  are dependencies of this SPA for it. The `MapView`/`MapAPI` stubs live in `__mocks__/@vempain/vempain-common-frontend.tsx`
  (`MAP_STUB_FILE`). Tested in `src/__tests__/file/SiteFileMap.test.tsx`.
- The typed file lists (`SiteFileList` over `GenericFileList`, routes `/images`, `/videos`, ... of `App.tsx`) act on single file resources
  without any gallery: every row has a publish button (`siteFileAPI.publishSelectedFiles({file_ids: [id]})`, `POST
  /content-management/file/site-files/publish-selected`, 202 with the `PUBLISH_SELECTED_FILES` task tracked through `trackTask`, the list
  reloads when it finishes) and a delete button behind an antd `Popconfirm` (`siteFileAPI.delete(id)`, `DELETE
  /content-management/file/site-files/{id}`, removes the file from the admin and its metadata from the website), and the rows can be
  selected for "Publish selected files (n)", one task for the batch like the gallery list. `GenericFileList` takes the columns as a
  builder `(reload) => columns` and a `toolbar(reload)` so that the actions reload the current page; the backend enforces the
  privileges (modify to publish, delete to delete), the SPA shows the actions on every row. Tested in `src/__tests__/file/SiteFileList.test.tsx`.
- Tables never grow wider than their container: `VempainTable` (`@vempain/vempain-auth-frontend`) drops the columns that do not fit
  into the expandable row, least important first, down to the identifying column and the actions. The lists rank their columns with
  `priority` (1 = kept longest), flag the identifying column `mobile` (the ID in `GalleryList` and `PageList`, the file name in
  `SiteFileList`) and give the action column and the fixed-size columns a `width`, the others a `minWidth`; a new list column needs
  these hints too, or it is dropped first.
- Every one of those lists has the "Only modified after publish" filter (`src/main/ReleaseFilterSwitch.tsx`, an antd `Switch` with that
  accessible name): on, only the resources whose website copy is outdated are shown, i.e. released once and modified after that
  release (`published` and `modified` both set, `published < modified`). The server-paged lists send it as `modified_after_publish`
  (`PagePagedRequest`, `GalleryPagedRequest`, `SiteFilePagedRequest`; `GenericFileList` owns the switch for the typed site file lists)
  and the backend filters; `WebSiteDataPublish` is server-paged too (`dataAPI.findPageableDataSets`, `DataPagedRequest` with
  `modified_after_publish`, `POST /content-management/data/paged`), so the data set filter is applied by the backend as well.
  `isModifiedAfterPublish` (`src/tools/releaseTools.ts`) remains for client-side uses. Keep the rule in that helper and in the backend's
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
  The lists with selectable ACL-bearing rows, `GalleryList` and the typed `SiteFileList`, carry the library's `AclBulkUpdateButton`
  ("Permissions of selected (n)") above the table: it opens the shared `AclBulkEditor`, which grants the same rows to every selected
  resource through `aclAPI.bulkUpdate` (`POST /content-management/acls/bulk`, `ADD` merges, `REPLACE` rewrites; the backend skips the
  ACLs the user may not modify). The ACL ids come from the rows (`FileGroupListResponse.acls[0].acl_id`, `SiteFileResponse.acl_id`) and
  are kept per selected id so a selection across pages stays complete; `reportAclBulkUpdate` (`src/tools/aclBulkMessages.ts`) turns the
  outcome into the success/skipped messages and the list reloads. `src/services/AclAPI.ts` extends the library's `AclAPI`. Tested in
  `src/__tests__/file/GalleryList.test.tsx` and `SiteFileList.test.tsx` (real library dialog, mocked services).
  Any new shared ACL component, rule or helper this SPA needs is added to `@vempain/vempain-auth-frontend` (the home of all shared ACL
  functionality) and consumed from there, never written here or in `vempain-common-frontend`.
- Editor integration: `PageEditor.tsx` and `PagePublish.tsx` are the reference host for `RichTextEditor` and its `dataProviders`; keep them aligned
  with the rt-editor integration guide. The `findInternalLinks` provider answers the editor's link dialog with the published pages and files
  of the website (`webSiteManagementAPI.findInternalLinks` -> `GET /admin-management/site/links`), mapped by `tools/internalLinkTools.ts` to the
  website's routes (`/pages/<path>`, `/file/<path>`, every segment URL-encoded); the website route prefixes live only there.
  The gallery, site file and data set providers hand the backend responses to the editor unchanged, so their `published` timestamp (null when never released to
  the website) reaches the editor's dialogs, which mark such a resource with a warning triangle; keep the
  field when mapping these responses.
- Page style: `PageEditor.tsx` edits the page's custom CSS in the "Page style" field (`page_style`; blank is saved as null) with the
  library's `PageStyleEditor` (`@vempain/vempain-rt-editor`: a CSS text mode and a visual mode switched in the field, both editing the
  same string; the Jest stub in `__mocks__/@vempain/vempain-rt-editor.tsx` renders it as the text area with the `aria-label` "Page style")
  and previews it on the editor canvas through the editor's `pageStyle` prop (`Form.useWatch`); `PagePublish.tsx` passes it to the
  read-only preview. The CSS is published with the page and applied by the website while the page is shown; authors target the canvas as
  `.vps-page-canvas` and may override the website's default style (its `:root` variables), which the editor preview cannot show.
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

`yarn lint` is type-aware (`parserOptions.projectService`) and fails on `@typescript-eslint/no-deprecated`: any use of functionality that the type declarations
mark `@deprecated` (Ant Design props, DOM or library APIs) must be replaced by the documented successor. CI runs it before the build.

`yarn build` type-checks with `tsc -b`: `tsconfig.json` is a solution file (`files: []` plus references to `tsconfig.app.json` and
`tsconfig.node.json`), which a plain `tsc` accepts without checking a single source, so only the `-b` form fails the build on type errors
(`vite build` alone never does). `tsconfig.test.json` is not referenced; the test sources are type-checked by ts-jest while the tests run.

- CI uses the reusable `frontend-spa.yaml` workflow from `vempain-workflows` (tests on PRs, Docker image on `main`).
- Do not commit `dist/`, `coverage/`, `node_modules/` or local environment files.
- Security findings and their mitigations are recorded in `security/OWASP-2025-audit-report.md`; keep it current when changing sanitization,
  URL building or authentication handling.

## Tag ACL rule

Tags are metadata, not ACL-bearing resources. Tag entities have no ACL information, so tag list, search, and mutation endpoints must not perform ACL checks on
tags. ACL checks apply only to resources that explicitly carry an ACL.
