# Infra360

**One platform to manage infrastructure assets across their entire lifecycle.**

Live demo: **[pravi-hackathon-hetvi.vercel.app](https://pravi-hackathon-hetvi.vercel.app)**
Demo login: `admin@infra360.demo` / `roads@infra360.demo` / `water@infra360.demo` /
`inspector@infra360.demo` / `maintenance@infra360.demo` — password **`demo1234`** for all.

Infra360 is a generalized, cross-department infrastructure asset lifecycle
management platform built for a hackathon. It is deliberately **not**
hard-coded around any single asset type (roads, water, lighting, …) — the
same data model, UI and workflows serve every department, with
category-specific attributes handled generically.

## Problem statement

> Building an end-to-end infrastructure asset inventory to track and manage
> assets across their entire lifecycle.

Government organizations run multiple departments, each managing physically
different assets, and the organizers deliberately left the category list
open-ended:

| Department | Example assets |
|---|---|
| Road & Building | Roads, Bridges, Government Buildings |
| Water | Pipelines, Pumps, Reservoirs |
| Drainage | Drains, Manholes |
| Street Lighting | Streetlights, Transformers |
| Traffic | Traffic Signals, CCTV Cameras |

**Explicitly out of scope:** QR codes — no QR libraries, pages, or buttons,
by explicit requirement.

## Our approach

The defining decision, made before any code was written, was to treat this
as **data modeling, not feature-building per department**. A system that
hard-codes behavior per asset type would need new code for every future
department. Infra360 instead has exactly one `Asset` table with a fixed set
of universal fields (condition, criticality, risk, status, lifecycle stage,
location, dates, cost) plus a single JSON column for whatever fields are
specific to that asset's category. Adding a sixth department requires a new
row in `Department`/`AssetCategory`, not a schema migration or new UI code.

The second decision was that **"end-to-end" means every stage is a real,
connected workflow, not a static inventory with a status field**. Logging an
inspection doesn't just save a row — it updates condition, recalculates
risk, schedules the next inspection, writes a lifecycle event, writes an
audit log entry, and generates a notification if the finding is poor.
Completing a work order creates a maintenance record, a lifecycle event,
updates the asset if the repair fixed it, recalculates risk, and logs the
audit trail — all in one transaction. Nothing is a dead-end form.

Third, **risk is transparent, not a black box** — a deterministic formula
(below) with a reasons list, not a model. And **decision support is honestly
labeled**: the Maintenance Priorities page suggests actions from simple,
auditable rules and is explicitly marked **"Prototype Decision Support,"**
never dressed up as a prediction.

## Features

- **Asset Inventory** — filterable/paginated list (search, department,
  category, status, criticality) and a 6-tab detail record: Overview
  (core fields + category-specific attributes), Lifecycle, Inspections,
  Maintenance, Audit Log, Relationships.
- **GIS Map** — every asset plotted on Leaflet/OpenStreetMap, color-coded by
  condition, filterable by department/category/status/criticality/lifecycle,
  searchable with fly-to, and marker popups with one-click inspection/work
  order actions.
- **Condition & Risk Assessment** — 0–100 condition score with fixed bands,
  and a deterministic, explainable risk formula (below) shown with its
  reasons, never just a number.
- **Lifecycle Management** — 13 possible stages (Planned → … → Disposed), no
  asset forced through all of them, full timeline per asset with a
  "Log Lifecycle Event" form.
- **Inspection Workflow** — global inspections list, overdue/never-inspected
  tracking, and a full create flow that cascades into condition, risk,
  lifecycle and audit updates.
- **Maintenance & Work Orders** — Requested → Assigned → In Progress →
  Completed/Cancelled, KPI overview (open/critical/overdue/completed/spend),
  and a detail page per work order.
- **Dashboard** — portfolio-wide KPIs, charts, ranked risk list, upcoming
  maintenance, overdue inspections and a live map preview — every number
  computed from the database on every request, nothing hard-coded.
- **Maintenance Priorities** — assets ranked by risk with rule-based
  recommended actions, labeled Prototype Decision Support.
- **Audit Trail** — every meaningful asset change (status, condition,
  inspections, work orders, lifecycle events) logged with old/new value and
  who made it.
- **Role-based access with real login** — see [Authentication](#authentication).

## Architecture

A single full-stack Next.js application — no microservices, no separate
frontend/backend repos. Vercel deploys the whole app; each page and API
route runs as its own serverless function:

```
Browser (React, Leaflet, Recharts)
        │
        ▼
Vercel Edge Network  ◄── git push (GitHub → auto build & deploy)
        │
        ▼
Next.js Application (one deployment)
  ├─ Pages (UI)        src/app/(app)/**        Server Components, calls Server Logic directly
  ├─ API Routes        src/app/api/**          REST endpoints for every client mutation
  └─ Server Logic       src/server/**           risk engine, audit log, role checks, domain logic
        │
        ▼
Prisma Client (@prisma/adapter-pg — serverless-safe driver adapter)
        │
        ▼
Neon PostgreSQL (single database, dev + production)
```

Map tiles are fetched by the browser directly from OpenStreetMap — the only
thing the backend supplies is asset coordinates and metadata.

## Data model

Every `Asset` — regardless of department — has the same ~25 core fields:
`assetCode`, `name`, `status`, `conditionScore` (0–100), `criticality`,
`riskScore` (computed), `lifecycleStage`, `latitude`/`longitude`/`address`/
`zone`, `installationDate`/`acquisitionDate`/`expectedLifeYears`/
`acquisitionCost`/`warrantyEndDate`, `owner`, `vendor`,
`lastInspectionDate`/`nextInspectionDate`, and `customAttributes` (JSONB) for
whatever is specific to that category:

```json
// Road
{ "lengthKm": 2.4, "widthMeters": 12, "lanes": 4, "surfaceType": "Asphalt" }

// Pipeline
{ "diameterMm": 300, "material": "Ductile Iron", "lengthKm": 5.1, "pressureBar": 6 }
```

Related tables: `Department`, `AssetCategory`, `Inspection`, `WorkOrder`,
`MaintenanceRecord`, `LifecycleEvent`, `AuditLog`, `AssetRelationship`,
`Notification`, `User`, `Vendor`.

## Risk engine

Deterministic and explainable — no ML, no AI:

```
conditionRisk       = 100 − conditionScore
criticalityScore    = LOW 25 · MEDIUM 50 · HIGH 75 · CRITICAL 100
failureHistoryScore = f(current status FAILED/DAMAGED, count of corrective/
                        emergency maintenance records, days overdue on
                        next inspection) — capped 0-100

riskScore = conditionRisk × 0.5 + criticalityScore × 0.3 + failureHistoryScore × 0.2
riskLevel = CRITICAL ≥75 · HIGH ≥50 · MEDIUM ≥25 · LOW <25
```

Every score ships with a **reasons list** (e.g. *"Poor condition score
(25/100)"*, *"2 previous corrective/emergency maintenance records"*)
computed by the same function that computes the score, so the explanation
can never drift from the number. See `src/server/risk.ts`.

## Authentication

A real, cookie-based login — not a production auth system, but not a
client-editable toggle either:

- `/login` checks email + password against 5 seeded demo accounts (see the
  top of this file), sets an `httpOnly` session cookie tied to the actual
  database `User` row.
- Next.js middleware (`src/middleware.ts`) protects every page — no session,
  no access, redirected to `/login`.
- API routes derive the acting role from the session cookie server-side
  (`src/server/authz.ts`), not a client-supplied header, and enforce
  per-action role requirements (e.g. only Inspectors/Admins can log
  inspections, only Maintenance Officers/Admins can complete work orders).
- Logout clears the session and redirects to `/login`.

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript | Server Components skip a separate API round-trip for reads |
| Styling | Tailwind CSS v4, shadcn/ui (Base UI) | Fast, accessible primitives; restrained enterprise look |
| Validation | Zod | Every API input validated at the boundary |
| Database | PostgreSQL (Neon, serverless) | Relational integrity for a genuinely relational domain |
| ORM | Prisma 7 + `@prisma/adapter-pg` | The driver-adapter pattern is what makes Prisma serverless-safe |
| Maps | Leaflet, React-Leaflet, OpenStreetMap | No API key, no vendor lock-in |
| Charts | Recharts | Theme-consistent, accessible dashboard visualizations |

## Project structure

```
src/
  app/
    (app)/                    Authenticated shell (sidebar + topbar)
      dashboard/  assets/[id]/  map/  inspections/
      maintenance/[id]/  maintenance/priorities/
      lifecycle/  departments/  reports/  import/
      notifications/  settings/
    api/                       REST endpoints, one folder per resource
      assets/  assets/[id]/inspections/  assets/[id]/lifecycle/
      assets/[id]/relationships/  work-orders/  departments/
      notifications/  relationships/[id]/
    login/                     Login page, form, and Server Actions
    layout.tsx                 Root layout (fonts, TooltipProvider)
    page.tsx                   Redirects "/" -> "/dashboard"
  components/
    layout/                    Sidebar, Topbar, PageHeader, session context
    map/                       Leaflet map + filters (client-only, dynamically imported)
    assets/  maintenance/  inspections/   Feature-specific dialogs & forms
    charts/                    Recharts wrappers (assets-by-department, risk, etc.)
    ui/                        shadcn/ui primitives
    status-badge.tsx, kpi-card.tsx, empty-state.tsx, feature-list.tsx
  server/                      Business logic — one file per domain
    assets.ts  inspections.ts  workOrders.ts  lifecycle.ts
    dashboard.ts  departments.ts  relationships.ts  notifications.ts
    risk.ts  recommendations.ts  audit.ts  authz.ts  errors.ts
  lib/
    constants.ts               Status/criticality/lifecycle vocabulary + colors
    validation.ts               Zod schemas for every API input
    session.ts                  Cookie-based session (login/logout)
    prisma.ts                   Prisma Client singleton (driver adapter)
    nav.ts, utils.ts, demo-users.ts
  middleware.ts                 Route protection (redirects to /login)
prisma/
  schema.prisma                 Full data model (12 models)
  seed.ts                       Idempotent seed (~170 realistic assets)
```

## Getting started

```bash
npm install

# Database — see .env.example for DATABASE_URL (Postgres, e.g. Neon or local)
npm run setup      # prisma generate + migrate + seed

npm run dev         # http://localhost:3000 -> redirects to /login
```

## Scripts

| Script | Does |
|---|---|
| `dev` / `build` / `start` | Next.js dev server / production build / production server |
| `lint` | ESLint |
| `db:migrate` | `prisma migrate dev` |
| `db:seed` | Runs `prisma/seed.ts` |
| `db:reset` | Drops and re-migrates + reseeds |
| `db:studio` | Prisma Studio |
| `setup` | generate + migrate + seed, for a fresh clone |

## Deployment

Hosted on **Vercel**, connected to GitHub — every push to `main` triggers
`npm install` → `prisma generate` (via a `postinstall` hook) → `next build`
→ deploy, with zero manual steps. The database is the same Neon Postgres
instance used in development, configured via one environment variable
(`DATABASE_URL`). There is no separate backend to deploy.

## Explicitly out of scope

- **QR codes** — excluded by explicit requirement.
- **CSV bulk import** — descoped given the hackathon timebox; flagged rather
  than half-built.
- **Production-grade authentication** — the login system is real (session
  cookies, server-side authorization) but intentionally simple: shared demo
  password, no signup/password-reset/MFA. A first addition in a follow-on
  phase.
- **Document uploads, a dedicated per-asset map tab, an Edit Asset form, a
  historical condition-trend chart** — real, deliberate, time-boxed cuts.
