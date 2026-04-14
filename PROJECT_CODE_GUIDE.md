# DocShare Project Code Guide

This document explains **why each folder/file exists**, **how the code works end-to-end**, and **what to do when changing code**.

---

## 1) High-level architecture

DocShare is a full-stack app:

- `frontend/` (Vue 3 + TypeScript): UI, routing, auth state, API calls, document actions.
- `backend/` (Express + TypeScript + Prisma + SQLite): auth, upload/share/download APIs, access control, DB persistence.
- Root-level files: docs, workspace dependencies, TypeScript base config.

Request flow:

1. User action in Vue page/component.
2. API helper in `frontend/src/services/api.ts` sends HTTP request.
3. Express route in `backend/src/routes/*` receives request.
4. Middleware (`authenticate`, `upload`) validates auth/file.
5. Controller (`backend/src/controllers/*`) performs Prisma queries and business logic.
6. Response updates frontend state (Vue Query cache + Pinia auth state).

---

## 2) Root folder files

### `README.md`
- **Why it exists:** onboarding and feature overview.
- **How it helps:** gives setup steps, endpoint list, architecture notes.
- **What to do with it:** keep updated when API contracts, setup commands, or features change.

### `tsconfig.json`
- **Why it exists:** shared/default TypeScript compiler settings.
- **How it helps:** keeps TS behavior consistent across backend/frontend extensions.
- **What to do with it:** update only when project-wide TS behavior needs change.

### `package.json` and `package-lock.json` (root)
- **Why they exist:** root-scoped dependencies (currently includes `prisma-erd-generator`).
- **How they help:** supports tooling not tied to only frontend/backend package.
- **What to do with them:** add only cross-project tooling here; app runtime dependencies belong in `frontend/` or `backend/`.

### `.gitignore`
- **Why it exists:** prevents committing generated/secrets/local files.
- **What to do with it:** add new generated artifacts (build outputs, DB files, local env files) when needed.

---

## 3) Backend (`backend/`)

### Backend folder purpose

The backend owns:
- User authentication
- Document metadata/storage coordination
- Sharing access control
- Audit logging

### `backend/package.json`
- **Why it exists:** backend scripts and dependency boundaries.
- **How it works:** scripts like `dev`, `db:migrate`, `db:seed` define operational lifecycle.
- **What to do:** keep backend-only dependencies here; avoid importing frontend libraries.

### `backend/.env.example`
- **Why it exists:** template for required environment variables.
- **What to do:** when adding new env vars (e.g., storage provider keys), document defaults/examples here.

### `backend/tsconfig.json`
- **Why it exists:** backend TypeScript compilation setup.
- **What to do:** adjust only for backend build/runtime constraints.

### `backend/scripts/inspect.js`
- **Why it exists:** utility script area for operational inspection/debugging.
- **What to do:** keep such scripts side-effect-safe unless explicitly intended.

---

## 4) Backend app entry and routing

### `backend/src/server.ts`
- **Why:** process entry point.
- **How:** imports `app` and starts listening on `PORT`.
- **Change guidance:** keep this thin; business logic should stay in controllers/services.

### `backend/src/app.ts`
- **Why:** central Express app composition.
- **How:** sets CORS, JSON parsing, static upload serving, route mounts, health endpoint.
- **Change guidance:** add cross-cutting middleware here (logging, security headers, rate limits).

### `backend/src/routes/auth.ts`
- **Why:** maps auth endpoint paths to controller functions.
- **How:** defines `POST /register`, `POST /login`.
- **Change guidance:** routes should only orchestrate middleware and handlers, not business logic.

### `backend/src/routes/documents.ts`
- **Why:** all document CRUD/download endpoints.
- **How:** applies `authenticate` globally, then upload/list/download/delete routes.
- **Change guidance:** preserve middleware order (`authenticate` before protected handlers).

### `backend/src/routes/shares.ts`
- **Why:** sharing and user-lookup endpoints.
- **How:** applies `authenticate`; exposes share/unshare/user-search endpoints.
- **Change guidance:** keep ownership checks in controller layer.

---

## 5) Backend middleware and utilities

### `backend/src/middleware/auth.ts`
- **Why:** reusable JWT guard for protected endpoints.
- **How:** reads `Authorization: Bearer <token>`, verifies token, attaches `req.user`.
- **What to do with code:** any new protected route should use this middleware (directly or via router-level `use`).

### `backend/src/middleware/upload.ts`
- **Why:** centralized file upload policy.
- **How:** `multer.diskStorage` stores files in `uploads/`, enforces mime/type + 10MB limit.
- **What to do with code:** update allowed MIME types/size here if product requirements change.

### `backend/src/utils/jwt.ts`
- **Why:** single source for JWT create/verify logic.
- **How:** validates `JWT_SECRET` at startup; signs with 24h expiry.
- **What to do with code:** keep token schema stable; if payload changes, update middleware/types/frontend assumptions.

---

## 6) Backend controllers (business logic)

### `backend/src/controllers/authController.ts`
- **Purpose:** register/login lifecycle.
- **How it works:**
  - Validates input.
  - Uses Prisma to find/create user.
  - Uses bcrypt for password hash/check.
  - Returns JWT + safe user object.
- **When editing:** never return password hashes; keep validation and auth errors explicit but non-leaky.

### `backend/src/controllers/documentController.ts`
- **Purpose:** upload/list/download/delete documents.
- **How it works:**
  - Upload: writes DB metadata from `req.file`.
  - List: returns two sets (`owned`, `shared`) with owner/share relations.
  - Download: checks access (owner or shared), logs audit event, sends file from disk.
  - Delete: owner-only delete + physical file unlink.
- **When editing:** preserve authorization checks before every file access operation.

### `backend/src/controllers/shareController.ts`
- **Purpose:** share/unshare permissions and target-user search.
- **How it works:**
  - Share: owner check -> user lookup by email -> duplicate share check -> create share.
  - Unshare: owner check -> delete by composite key.
  - Users: search list excluding requester.
- **When editing:** protect against self-share, duplicate shares, and unauthorized unshare.

---

## 7) Prisma/database layer

### `backend/prisma/schema.prisma`
- **Why:** authoritative DB model definition.
- **How it works:**
  - Models: `User`, `Document`, `DocumentShare`, `AuditLog`.
  - Relations enforce ownership, sharing, and download audit history.
  - Composite uniqueness (`documentId + userId`) prevents duplicate sharing.
- **When editing:** schema change must be followed by migration + regenerated Prisma client.

### `backend/prisma/migrations/`
- **Why:** versioned DB evolution history.
- **How it works:** each migration folder includes SQL needed to move DB state forward.
- **When editing:** never hand-edit old migration history in normal flow; create new migration for new changes.

### `backend/prisma/migrations/migration_lock.toml`
- **Why:** Prisma migration provider lock metadata.
- **When editing:** usually not manually edited.

### `backend/prisma/seed.ts`
- **Why:** deterministic starter data for local/demo/testing.
- **How:** creates sample users with bcrypt-hashed passwords.
- **When editing:** keep seed idempotency in mind if you later switch to repeated seed runs.

---

## 8) Frontend (`frontend/`)

### Frontend folder purpose

The frontend handles:
- Auth screens and token/session persistence
- Dashboard UI for upload/share/download/delete
- Router access guards
- API communication and request error handling

### `frontend/package.json`
- **Why:** frontend runtime/build dependencies.
- **How:** scripts for Vite dev/build/preview.
- **What to do:** keep browser/UI dependencies only in this package.

### `frontend/index.html`
- **Why:** Vite HTML host page for Vue mount point.

### `frontend/vite.config.ts`
- **Why:** Vite bundler config (dev server/build integration).
- **What to do:** configure alias/proxy/build optimizations here.

### `frontend/tsconfig.json`, `frontend/vite-env.d.ts`, `frontend/src/shims-vue.d.ts`
- **Why:** TypeScript type support and Vue SFC typing.
- **What to do:** update when adding TS path aliases or env typings.

### `frontend/.env.example`
- **Why:** frontend env variable template (e.g., API base URL overrides).

### `frontend/tailwind.config.ts` + `frontend/postcss.config.js` + `frontend/src/style.css`
- **Why:** utility-first styling pipeline.
- **How:** Tailwind directives + reusable component classes (`.btn`, `.input`, `.card`).
- **What to do:** add global visual tokens and shared utility classes here.

---

## 9) Frontend app bootstrap, state, and routing

### `frontend/src/main.ts`
- **Why:** bootstraps Vue app.
- **How:** registers Pinia, router, and Vue Query plugins.
- **When editing:** plugin order matters for lifecycle and injected context.

### `frontend/src/App.vue`
- **Why:** app shell root.
- **How:** minimal wrapper rendering `<router-view />`.

### `frontend/src/router.ts`
- **Why:** page-level navigation and auth guards.
- **How:** route metadata (`requiresAuth`, `requiresGuest`) checked in `beforeEach`.
- **When editing:** keep guard logic aligned with auth store behavior.

### `frontend/src/stores/auth.ts`
- **Why:** central auth/session state (Pinia).
- **How:** login/register/logout methods, token + user localStorage persistence, axios auth header setup.
- **When editing:** ensure `token`, `user`, and axios auth header stay synchronized.

---

## 10) Frontend API and UI code

### `frontend/src/services/api.ts`
- **Why:** typed HTTP client boundary.
- **How:** axios instance with:
  - request interceptor (inject bearer token),
  - response interceptor (auto-logout on 401),
  - grouped API functions (`authAPI`, `documentsAPI`, `sharesAPI`),
  - shared TypeScript interfaces.
- **When editing:** treat this as the contract layer; update types here whenever backend response changes.

### `frontend/src/utils/error.ts`
- **Why:** normalize unknown/Axios errors to UI-safe strings.
- **When editing:** keep fallback paths safe for non-standard errors.

### `frontend/src/pages/Login.vue`
- **Why:** sign-in page.
- **How:** form + Vue Query mutation -> `authStore.login()` -> route to dashboard.

### `frontend/src/pages/Register.vue`
- **Why:** registration page.
- **How:** form + mutation -> `authStore.register()` -> route to dashboard.

### `frontend/src/pages/Dashboard.vue`
- **Why:** main authenticated workspace.
- **How:** loads documents query, renders owned/shared lists, opens share modal, hosts upload component.

### `frontend/src/components/Layout.vue`
- **Why:** shared authenticated layout shell with navbar and logout.

### `frontend/src/components/DocumentUpload.vue`
- **Why:** encapsulates upload UX.
- **How:** file input -> upload mutation -> invalidate `documents` cache.
- **When editing:** maintain file input reset + query invalidation behavior.

### `frontend/src/components/DocumentCard.vue`
- **Why:** reusable card for owned/shared document actions.
- **How:** download/delete mutations with optimistic UI refresh via query invalidation.
- **When editing:** keep owner checks for share/delete actions in UI, but still rely on backend enforcement.

### `frontend/src/components/ShareModal.vue`
- **Why:** share/unshare interaction for a selected document.
- **How:** share/unshare mutations, local reactive shares list for instant UI feedback, query invalidation.
- **When editing:** preserve sync between local optimistic state and server refetches.

---

## 11) How to work with this code safely

### A) Adding a new backend feature
1. Add/adjust Prisma model in `schema.prisma` (if needed).
2. Run migration and regenerate client.
3. Add controller logic in `backend/src/controllers/`.
4. Expose route in `backend/src/routes/`.
5. Add middleware checks (`authenticate`, validation) as needed.
6. Update frontend API contract in `frontend/src/services/api.ts`.
7. Update or add UI components/pages.

### B) Changing API payloads
- Update backend response shape first.
- Immediately update `frontend/src/services/api.ts` interfaces.
- Update all affected components/pages relying on those fields.

### C) Changing auth behavior
- Backend token structure in `backend/src/utils/jwt.ts` and auth middleware.
- Frontend persistence/header logic in `frontend/src/stores/auth.ts` and `frontend/src/services/api.ts`.
- Router guard assumptions in `frontend/src/router.ts`.

### D) Changing file handling rules
- File type/size/destination in `backend/src/middleware/upload.ts`.
- Any UI hints or allowed extensions in `frontend/src/components/DocumentUpload.vue`.

### E) Common pitfalls to avoid
- Do not rely only on UI checks for access control; backend must enforce ownership/share rules.
- Do not expose sensitive fields (`password`) in controller responses.
- Keep local optimistic UI changes paired with query invalidation/refetch.
- Keep migration history consistent; do not rewrite old migrations casually.

---

## 12) Quick command map

From `backend/`:
- `npm install`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run dev`

From `frontend/`:
- `npm install`
- `npm run dev`

---

## 13) Suggested documentation maintenance rule

Whenever you add or modify:
- a route,
- a controller response shape,
- a DB model/relation,
- or a core frontend state/API interface,

update both:
- `README.md` (public overview), and
- this file `PROJECT_CODE_GUIDE.md` (deep developer guide).

