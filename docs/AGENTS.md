# AGENTS.md

## Scope

- This repo is the **admin SPA** for the Vempain CMS: a React 19 + TypeScript + Vite frontend for content, media, scheduling, user, and website administration.
- The app is a client-side SPA rooted at `src/index.tsx` and `src/App.tsx`; routes are grouped by feature folders under `src/content`, `src/file`,
  `src/schedule`, `src/user`, `src/website`, and `src/main`.

## Environment & install

- Package manager is **Yarn 4** (`packageManager` in `package.json`, `yarnPath` in `.yarnrc.yml`). The repo expects the checked-in Yarn release at
  `.yarn/releases/yarn-4.12.0.cjs`.
- Private package access uses GitHub Packages via `.yarnrc.yml`; installs need `VEMPAIN_ACTION_TOKEN` in the environment for `@vempain/*` packages.
- Runtime config comes from `VITE_APP_*` variables. Development uses `.env.local` via `env-cmd`; other shipped files are `.env.combined`, `.env.stage`, and
  `.env.prod`.

## Daily commands

- Install: `yarn install`
- Dev server: `yarn start` (loads `.env.local`, serves on port `3000` per `vite.config.ts`)
- Alternate dev server: `yarn start-combined` (loads `.env.combined`, serves on port `4000`)
- Production build: `yarn build:production`
- Full build path: `yarn build`
- Tests: `yarn test`, `yarn test:watch`, `yarn test:coverage`, `yarn test:debug`
- Lint: `yarn lint`, autofix: `yarn lint:fix`
- `prestart` and `prebuild` run `generateBuildInfo.js`, which regenerates `src/buildInfo.json` from `VERSION` + git tags.

## Architecture that matters

- Auth/session comes from `@vempain/vempain-auth-frontend`; `SessionProvider` wraps the app in `src/index.tsx`, and `/login` + `/logout` routes come from that
  package.
- API classes live in `src/services/**` and typically **extend `AbstractAPI`** from the auth package (example: `src/services/PageAPI.ts`,
  `src/services/WebSiteManagementAPI.ts`). Preserve this so auth headers and 401 interception continue to work.
- API instances are exported as singletons (`pageAPI`, `galleryAPI`, `webSiteManagementAPI`, etc.) and consumed directly from feature components.
- Types are centralized in `src/models/Requests`, `src/models/Responses`, and barrel-exported through `src/models/index.ts`.

## Project-specific coding patterns

- This codebase avoids TS `enum`; use the existing `as const` object pattern (example: `src/models/FileTypeEnum.ts`) because `tsconfig.app.json` enables
  `erasableSyntaxOnly`.
- UI is Ant Design with a global dark theme in `src/App.tsx`. Reuse Ant components and existing theme tokens before introducing custom styling.
- Feature folders keep screens close to their helpers; use barrel exports like `src/content/index.ts` and `src/file/index.ts` when adding new screens.
- Table-heavy pages often use Ant `Table` with typed columns. Generic paged file tables go through `src/file/GenericFileList.tsx`, which translates Ant table
  state into backend pagination/sort parameters.
- Website-user resource assignment uses Ant `Transfer` + `rc-virtual-list` for large datasets (`src/website/WebSiteUserList.tsx`). Follow that pattern for
  paged, selectable, high-volume lists.

## Content/editor specifics

- Page body editing is not a plain textarea: `src/content/RichTextEditor.tsx` is a custom editor that round-trips Vempain embed tags through placeholder HTML.
- Embed parsing/rendering rules live in `src/tools/embedTools.ts`; if you change embed formats, update both the parser and placeholder conversion logic.
- Existing embed coverage is concentrated in `src/__tests__/embedTools.test.ts`; extend those tests whenever embed syntax or placeholder behavior changes.
- GPS time-series embeds are selected through `src/content/embeds/RichEmbedGpsTimeSeriesEditor.tsx` and `CommonDataSetSelectorModal.tsx`.
    - The selector is a dropdown-style picker, not a freeform identifier input.
    - It loads datasets from Admin with `type=time_series` and server search `gps`, then filters the already-loaded list client-side while the user types.
    - Do not reintroduce an identifier-prefix-only lookup there; the selector must continue to surface legacy unprefixed GPS dataset identifiers.

## Testing & debugging notes

- Jest is configured in `jest.config.js` as an **ES module** config and explicitly transforms `@vempain/vempain-auth-frontend`; do not “fix” external-package
  imports by mocking unless the test really needs a mock.
- Current tests are utility-focused (`src/__tests__/numberTools.test.ts`, `timeTools.test.ts`, `embedTools.test.ts`); new feature work often benefits from
  adding small tool/parser tests rather than only UI tests.
- GPS embed selector coverage now lives in `src/__tests__/RichEmbedGpsTimeSeriesEditor.test.tsx`; keep that test aligned with the fetch-on-open +
  client-side-filter behavior.
- Footer/version output depends on generated build info plus env vars (`src/main/BottomFooter.tsx`), so if footer output looks stale, rerun a script that
  triggers `prebuild`/`prestart`.

## Safe-change reminders for agents

- Prefer minimal edits that preserve current route structure and singleton service usage.
- When adding new backend fields, update **both** request/response types and the consuming form/table columns.
- When adding a new feature area, wire it through: service -> models -> feature component -> route in `src/App.tsx` -> optional TopBar entry in
  `src/main/TopBar.tsx`.

