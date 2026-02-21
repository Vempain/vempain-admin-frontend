# Vempain Admin — Feature Description

**Vempain Admin** is the administrative frontend for the Vempain CMS (Content Management System). It provides a browser-based interface for authorised administrators to manage every aspect of a Vempain-powered website: structured content, media files, galleries, scheduled operations, user accounts, and site-wide configuration.

- **Version:** 0.9.0
- **License:** GPL-2.0
- **Author:** Paul-Erik Törrönen
- **Project homepage:** <https://vempain.poltsi.fi/>

---

## Purpose

Vempain Admin acts as the single control panel through which content editors and site administrators interact with the Vempain back-end API. It communicates exclusively through a REST API (configured via `VITE_APP_API_URL`) and relies on the `@vempain/vempain-auth-frontend` library for authentication and session management.

---

## Functional Features

### 1. Content Management

| Feature | Description |
|---|---|
| **Pages** | Create, edit, delete, and publish web pages. Pages support parent–child hierarchies, custom URL paths, SEO indexing flags, security settings, and a configurable publishing status. |
| **Layouts** | Define reusable HTML skeleton structures that pages and forms are rendered within. Full CRUD operations are provided. |
| **Components** | Build and manage reusable UI component definitions (name + component data). Components are referenced inside forms. |
| **Forms** | Compose forms from layouts and components. Forms are the primary content-delivery building block attached to pages. |
| **Access Control Lists (ACLs)** | Assign and edit ACL entries on any content resource, controlling which user units have read/write/create/delete/modify permissions. |

### 2. File & Media Management

The file management area supports **14 distinct file types**, each with a dedicated list view:

| File Type | Description |
|---|---|
| Archives | Compressed/archive files |
| Audios | Audio media |
| Binaries | Generic binary files |
| Data | Structured data files |
| Documents | Textual documents (PDF, Office, etc.) |
| Executables | Executable/script files |
| Fonts | Web and desktop font files |
| Icons | Small icon assets |
| Images | Raster image files |
| Interactives | Interactive media (e.g. Flash, WASM) |
| Thumbs | Auto-generated thumbnail images |
| Unknowns | Files with unrecognised types |
| Vectors | SVG and other vector graphics |
| Videos | Video media |

All file views support paginated listing and metadata inspection, while file-card previews are available in gallery publish/refresh workflows when selecting site files.

### 3. Gallery Management

- Create, edit, and delete image galleries.
- Add site files to galleries and organise gallery metadata.
- **Publish** galleries to make them visible on the public site.
- **Refresh** gallery contents when underlying files change on disk.
- Paginated search and listing of all galleries.

### 4. File Import

- Browse the server's directory tree and select a source directory for import.
- Optionally create a new gallery and/or a new page from the imported directory in a single workflow.
- Bulk-import files into the Vempain file store.

### 5. Scheduling

Three dedicated scheduling modules allow batch operations to be planned and triggered:

| Module | Description |
|---|---|
| **System Schedules** | View, manage, and manually trigger back-end system-level scheduled jobs (e.g. maintenance, clean-up). |
| **File Import Schedules** | Define and trigger scheduled directory-import tasks that run at configurable intervals. |
| **Publishing Schedules** | Schedule content items (pages, galleries) for automatic publication at a future date/time. |

### 6. User & Unit Management

- **System Users** — List, create, and edit Vempain administrator accounts. User records include profile data and unit assignments.
- **Units** — Create and manage organisational units (groups) used to scope ACL permissions across the system.

### 7. Website Administration

- **Web Site Users** — Manage the accounts of visitors/customers who register on the public-facing website. Supports searching, creating, editing, viewing assigned resources and ACLs for each user.
- **Website Configuration** — View and edit global site-wide key/value configuration entries. Configuration values are typed (`STRING`, `NUMBER`, `BOOLEAN`, `LIST`), providing controlled administration of runtime settings.

---

## Architecture & Integration Notes

- **Single-Page Application (SPA)** built with React 19 and React Router v7; all routing is client-side.
- **API layer** — Every data operation is handled through strongly-typed TypeScript service classes (e.g. `PageAPI`, `GalleryAPI`, `ScheduleAPI`) that extend a shared `AbstractAPI` base from `@vempain/vempain-auth-frontend`. All requests use Axios.
- **Authentication** — Delegated to the `@vempain/vempain-auth-frontend` package, which manages login/logout state and injects auth tokens into API requests. The `/login` and `/logout` routes are handled by this package.
- **UI framework** — Ant Design v6 (enterprise React component library) with a dark-mode theme applied globally.
- **Type safety** — The full data layer is described with TypeScript interfaces covering request payloads (`models/Requests/`) and response shapes (`models/Responses/`), plus enum files directly under `src/models/` (`FileTypeEnum.ts`, `PublishStatusEnum.ts`, `ContentTypeEnum.ts`, etc.).
- **Environment configuration** — Runtime settings (API URL, page title, copyright text) are injected at build time via `VITE_APP_*` environment variables from per-environment `.env` files.
- **Build tooling** — Vite 7 with the official React plugin (`@vitejs/plugin-react`) for fast development and production builds. Tests run via Jest with `ts-jest` and `@testing-library/react`.

---

## Primary Actors / User Roles

| Role | Typical Activities |
|---|---|
| **Content Editor** | Create and publish pages, forms, components, and layouts; manage galleries and file assets. |
| **Media Manager** | Import files from server directories, organise files into galleries, refresh gallery content. |
| **System Administrator** | Manage system users, organisational units, ACLs, website configuration, and scheduled jobs. |
| **Website Manager** | Manage web-site (public) user accounts, assign resources and ACLs to those users. |

---

## Quick Start (Development)

```bash
# 1. Install dependencies
yarn install

# 2. Copy and customise the environment file
cp .env .env.local
# Edit VITE_APP_API_URL to point at your Vempain back-end

# 3. Start the development server
yarn start
```

For production builds:

```bash
# Edit .env.prod with production values, then:
yarn build:production
```

Serve the resulting `dist/` directory with any static-file web server (e.g. nginx, Caddy).

---

## Repository Structure

```
src/
├── App.tsx                  # Root routing and layout shell
├── main/                    # TopBar, BottomFooter, Home dashboard
├── content/                 # Pages, layouts, components, forms, ACL management
├── file/                    # File lists, gallery management, file import
├── schedule/                # System, file-import, and publishing schedules
├── user/                    # System user and unit management
├── website/                 # Web-site user and configuration management
├── services/                # Axios-based API service classes
│   └── Files/               # File-specific API services
├── models/                  # TypeScript interfaces and enums
│   ├── Requests/            # Request payload types
│   └── Responses/           # Response payload types
└── tools/                   # Shared utility functions
```
