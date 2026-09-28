# Infra360

**One platform to manage infrastructure assets across their entire lifecycle.**

Infra360 is a generalized, cross-department infrastructure asset inventory and
lifecycle management platform built for a university hackathon. It is
deliberately **not** hard-coded around any single asset type (roads, water,
lighting, …) — the same data model and UI serve every department, with
category-specific attributes handled generically.

## Problem statement

> Building an end-to-end infrastructure asset inventory to track and manage
> assets across their entire lifecycle.

Government organizations run multiple departments, each managing different
physical assets:

| Department | Example assets |
|---|---|
| Road & Building | Roads, Bridges, Government Buildings |
| Water | Pipelines, Pumps, Reservoirs |
| Drainage | Drains, Manholes |
| Street Lighting | Streetlights, Transformers |
| Traffic | Traffic Signals, CCTV Cameras |

Infra360 treats these as data, not code — new departments and categories can
be added without changing application logic.

**Explicitly out of scope:** QR codes. No QR libraries, pages, or buttons.

## Product pillars

Asset Inventory · Department/Category Management · GIS · Condition Assessment
· Criticality · Risk Scoring · Lifecycle History · Inspections · Maintenance ·
Work Orders · Asset Relationships · Auditability · Decision Support

## Architecture

A single full-stack Next.js application — no microservices, no separate
frontend/backend repos:

```
Next.js (App Router)
  ├─ UI                    src/app/**, src/components/**
  ├─ API / Server Actions  src/app/api/**, server actions
  └─ Business Logic        src/lib/**
        │
        ▼
     Prisma ORM
        │
        ▼
     PostgreSQL
```

## Tech stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui, Lucide icons
- **Backend:** Next.js API routes / Server Actions
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Charts:** Recharts
- **Maps:** Leaflet + React Leaflet + OpenStreetMap
- **Auth:** Lightweight, role-aware demo access (role switcher, no backend
  login) — intentionally not enterprise auth for a hackathon timebox.

## Project structure

```
src/
  app/
    (app)/                  Authenticated app shell (sidebar + topbar)
      dashboard/
      assets/
      map/
      inspections/
      maintenance/
      lifecycle/
      departments/
      reports/
      import/
      notifications/
      settings/
    layout.tsx              Root layout (fonts, providers)
    page.tsx                Redirects "/" -> "/dashboard"
  components/
    layout/                 Sidebar, Topbar, PageHeader, demo-role context
    map/                    Leaflet map (client-only, dynamically imported)
    ui/                     shadcn/ui primitives
    status-badge.tsx        Status / criticality / lifecycle / risk badges
    kpi-card.tsx, empty-state.tsx, feature-list.tsx
  lib/
    constants.ts            Status/criticality/lifecycle vocabulary + color semantics
    nav.ts                  Sidebar navigation config
    utils.ts                cn() helper (shadcn)
prisma/
  schema.prisma             Full data model (Department, AssetCategory, Asset,
                             LifecycleEvent, Inspection, WorkOrder,
                             MaintenanceRecord, Document, AuditLog,
                             AssetRelationship, Notification, User)
  seed.ts                   Idempotent seed (~170 realistic assets)
```

## Data model notes

- Category-specific attributes (e.g. a road's `lengthKm`/`lanes`, a
  pipeline's `diameterMm`/`material`) live in a `customAttributes` JSONB
  column on `Asset` rather than as separate tables per category — this is
  what keeps the platform generalized instead of hard-coded per asset type.
- Risk score is computed transparently from condition, criticality and
  failure/work-order history rather than hidden behind a black-box model.
- Color semantics are never the only signal — every status/risk indicator
  pairs a color with a text label (green = healthy/low risk, amber =
  warning, orange = high risk, red = critical, blue = informational).

## Getting started

```bash
npm install

# Database (see .env.example for DATABASE_URL)
npm run setup      # prisma generate + migrate + seed

npm run dev         # http://localhost:3000
```

Other scripts: `db:migrate`, `db:seed`, `db:reset`, `db:studio`, `build`,
`lint`.

## Status

- ✅ App shell: routing, sidebar/topbar navigation, theme, reusable UI
  primitives, placeholder pages for every module (no fabricated dashboard
  numbers).
- ✅ Database layer: full Prisma schema on PostgreSQL, idempotent seed data.
- ⏳ Wiring pages to live queries (dashboard aggregates, asset table/detail,
  map markers, inspections/maintenance CRUD) is the next integration pass.
