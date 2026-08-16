[![Dependabot Updates](https://github.com/Vempain/vempain-admin-frontend/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/Vempain/vempain-admin-frontend/actions/workflows/dependabot/dependabot-updates)
[![CodeQL](https://github.com/Vempain/vempain-admin-frontend/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/Vempain/vempain-admin-frontend/actions/workflows/github-code-scanning/codeql)
[![CI](https://github.com/Vempain/vempain-admin-frontend/actions/workflows/ci.yaml/badge.svg)](https://github.com/Vempain/vempain-admin-frontend/actions/workflows/ci.yaml)
![GitHub Tag](https://img.shields.io/github/v/tag/Vempain/vempain-admin-frontend)
![GitHub License](https://img.shields.io/github/license/Vempain/vempain-admin-frontend?color=green)

# Vempain admin frontend

See [documentation](development.md) for development processes and guidelines.

## Prerequisites

To run the frontend in production, you need a web server that can serve static files. For development, you need Node.js and npm.

## Setting up development environment

### ENV files

Copy and modify appropriately the `.env` to `.env.local`, `.env.stage` and `.env.prod` as these are used to run the `yarn start`,
`yarn build:stage` and `yarn build:production` scripts.

Run `yarn install` to install the necessary npm packages.

Now you can start up the local development environment with the command `yarn start`.

[AGENTS.md](docs/AGENTS.md) has more detailed orientation and workflow guidance for agents working in this codebase.

## Paginated data

Admin tables and page selectors send pagination, sorting, and filtering through the shared
`PagedRequest` request-body contract. The backend returns `PagedResponse`
metadata, which is passed to Ant Design tables through their built-in pagination and sorting support. Site-file, gallery, and website-resource requests no
longer use legacy pagination query parameters. Page and gallery selectors use Ant Design Select search against their paged endpoints and load the next 50
options when the dropdown reaches its scroll boundary.

Gallery selectors and GalleryList use the lightweight gallery `paged-list` endpoint. Its
`FileGroupListResponse` items include `file_count` but do not include associated file details. Page publish and page editor gallery lists use the corresponding
lightweight page-linked endpoint. The full `paged` endpoint remains available for screens that display gallery files.