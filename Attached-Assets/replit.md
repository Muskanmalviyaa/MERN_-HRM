# Attendance Core

A full-stack Attendance Management System that tracks employee attendance using live selfie and GPS location verification, with role-based access for Employee, Manager, and Admin roles.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port varies)
- `pnpm --filter @workspace/attendance-app run dev` — run the frontend (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, shadcn/ui, wouter, React Query
- Auth: Clerk (Replit-managed, RBAC via DB role column)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema: `users.ts`, `attendance.ts`, `overtime.ts`
- `artifacts/api-server/src/routes/` — Route handlers: `users.ts`, `attendance.ts`, `overtime.ts`, `reports.ts`
- `artifacts/attendance-app/src/` — React frontend
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas (do not edit)

## Architecture decisions

- Role-based access is stored in the DB `users.role` column (employee | manager | admin). Clerk handles identity; the DB handles permissions.
- Selfie images are stored as base64 data URLs in the `selfie_url` text column. In production, these should be moved to object storage (presigned URLs).
- The `/users/me/sync` endpoint is called on every login to upsert the user record from Clerk identity into the local DB.
- Working hours are calculated server-side on punch-out: `(punchOut - punchIn) / 3600000`. Status is `completed` if ≥ 8 hours.
- All attendance queries are role-scoped: employees see only their own records, managers/admins can see all.

## Product

- **Employee**: Punch in/out with live selfie capture and GPS, view their attendance history, request overtime, view dashboard with working hours progress.
- **Manager**: View team attendance, review and approve/reject overtime requests, validate attendance records (mark selfies valid/invalid).
- **Admin**: All manager capabilities plus user management (change roles), system-wide stats and reports.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`, then rebuild the API server.
- Import types from `@workspace/api-client-react` (the barrel), never from deep paths like `/src/generated/api.schemas`.
- The `SESSION_SECRET` env var exists but is not used — Clerk handles sessions via cookies.
- Selfie data URIs can be large — consider object storage for production.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
