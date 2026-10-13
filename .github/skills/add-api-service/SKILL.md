---
name: add-api-service
description: Add a backend API client to the admin frontend (class extending AbstractAPI, singleton on VITE_APP_API_URL with the backend prefix, snake_case models). Use when a screen needs a new admin backend resource.
---

# Add an API service to vempain-admin-frontend

- One `src/services/<Name>API.ts` per backend resource: `class XxxAPI extends AbstractAPI<Request, Response>` from
  `@vempain/vempain-auth-frontend`, exported as a singleton built with `import.meta.env.VITE_APP_API_URL` and the backend prefix (`/content-management/...`,
  `/admin-management/...`, `/schedule-management/...`). Call `this.setAuthorizationHeader()` before custom
  requests; `findPageable` posts a `PagedRequest` to `<base>/paged`.
- Models in `src/models/Requests` and `src/models/Responses` mirror the backend DTO field names in snake_case; never rename to camelCase.
  Endpoints that answer `202` return `TaskAcceptedResponse` (`PublishResponse.task`, `RefreshResponse.task`).
- The backend contract lives in `vempain-admin-backend/api`; add the endpoint there first (`add-rest-endpoint` skill of that repository)
  and keep `AGENTS.md` of both repositories in step.
- Test in `src/__tests__/` with the Axios instance mocked; assert the path and body sent and the data returned.
