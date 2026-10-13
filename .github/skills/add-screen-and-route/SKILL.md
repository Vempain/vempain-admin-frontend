---
name: add-screen-and-route
description: Add a screen to the Vempain admin frontend (component in the feature folder, protected route in App.tsx, TopBar menu entry, texts in src/i18n.ts, Jest test). Use for any new page, editor, list or navigation entry.
---

# Add a screen to vempain-admin-frontend

1. Component in the feature folder: `src/content/` (components, forms, layouts, pages), `src/file/` (galleries, site files),
   `src/schedule/`, `src/user/`, `src/website/`, `src/administration/`.
2. Route in `src/App.tsx` under `ProtectedRoute` **and** a menu entry in `src/main/TopBar.tsx`; both change together.
3. Editors show the audit trail with `src/main/MetadataForm.tsx` (read-only `Descriptions`, user ids resolved by `resolveUserName`) and keep
   the audit fields as hidden form items; results go through `SubmitResultHandler`. A new entity starts with one ACL row granting
   `useSession().userSession.id` every privilege; the ACL rows are edited with the shared `AclEditor` through `src/content/AclEdit.tsx`.
4. User and unit management are the shared screens of `@vempain/vempain-auth-frontend` bound to `userAPI`/`unitAPI`; never copy them.
5. Rich-text or HTML from the backend goes through `src/tools/richTextSecurity`, `urlSecurity`, `footerSecurity`; never bypass them.
6. Texts through `react-i18next` keys in `src/i18n.ts`; models in `src/models/{Requests,Responses}` in snake_case; no TypeScript `enum`
   (`as const` objects).
7. Test in `src/__tests__/` (mirror the `src/` folder): mock the services module and, for screens calling `useTaskProgress`,
   `@vempain/vempain-common-frontend`; `src/setupTests.ts` holds the jsdom stubs.
8. Run `yarn lint`, `yarn test`, `yarn build` (see `validate-frontend`) and describe the screen in `AGENTS.md`.
