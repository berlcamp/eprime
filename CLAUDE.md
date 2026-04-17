# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRIME-HRM — a multi-module HR management system for DepEd (Department of Education) built with Next.js 14 App Router + Supabase + TypeScript.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run generate:types  # Regenerate Supabase types from remote schema
```

No test framework is configured.

## Architecture

### Routing (App Router)

Routes are grouped by module under `app/`:

- `(hr)/` — Core HR: employees, profiles, assignments, positions, promotions, service records, leave tracker
- `(rsp)/` — Recruitment & Selection: applicants, rankings, screening
- `(public)/` — Unauthenticated pages: job applications, vacant positions, applicant status
- `pms/` — Performance Management: IPCRF, OPCRF, competencies
- `landd/` — Learning & Development: training, IDP, program proposals
- `randr/` — Recognition & Rewards: service awards, meritorious
- `settings/` — System config: districts, offices, schools, positions, salaries, cron
- `api/` — API routes: signup, password update, email triggers, cron announcements

### State Management (Two Layers)

**Redux Toolkit** (`GlobalRedux/`) — generic list-based slices reused across pages:
- `listSlice` / `list2Slice` — primary and secondary data lists
- `slowListSlice` — paginated/lazy-loaded lists
- `remarksSlice`, `resultsCounterSlice`, `recountSlice`

The store is created per-request via `makeStore()` in `store.ts` and wrapped with `useRef` in `provider.js`.

**React Context** (`context/`):
- `SupabaseProvider` — exposes `supabase` client, `session`, and bootstrapped lookup data (`systemAccess`, `systemUsers`, `systemSchools`, `systemOffices`). Data is fetched server-side in `app/layout.tsx` and passed down.
- `FilterContext` — global filters, pagination (`perPage`), dark mode, online status, toast helper (`setToast`), and `hasAccess(type)` for permission checks.

### Data Layer

**Supabase** (PostgreSQL + Auth + Realtime). All browser-side data fetching goes through `utils/fetchApi.ts`, which contains 100+ query functions (one per resource type). Each function takes filter/pagination params and queries Supabase directly via the browser client.

Key tables: `hrm_users`, `hrm_system_access`, `hrm_schools`, `hrm_offices`, `hrm_districts`, `hrm_positions`, `kra`, `error_logs`.

- `utils/supabase-browser.ts` — browser client (uses `@supabase/ssr`)
- `utils/supabase-server.ts` — server client with cookie handling
- Errors are logged to Supabase `error_logs` table via `logError()` in fetchApi.ts

### Auth & Access Control

Supabase Auth with session-based JWT. The root layout (`app/layout.tsx`) fetches session server-side and passes it to `ClientProviders`. Access control uses `hrm_system_access` table checked via `useFilter().hasAccess(type)`. All data is scoped by `NEXT_PUBLIC_ORG_ID`.

### Page Pattern

Most pages follow: `useSupabase()` for session → `useFilter()` for filters/pagination → Redux dispatch for list data → fetch on mount → render table with modal-based CRUD.

### UI Stack

- **shadcn/ui** components in `components/ui/` (Radix primitives + Tailwind + CVA)
- **Tailwind CSS** with dark mode (CSS variable strategy)
- **Lucide React** + Heroicons for icons
- **react-hot-toast** for notifications
- **jsPDF** + **ExcelJS** for PDF/Excel exports (`components/Pdf/`, `components/Printables/`)
- **react-to-print** for browser print dialogs
- **React Hook Form** + **Zod** for form handling
- **Resend** / **Mailgun** for transactional email (`components/Emails/`)

### Types

- `types/index.ts` — master type file (Employee, SchoolTypes, PositionTypes, UserAccessTypes, etc.)
- `types/pmsTypes.ts`, `types/landTypes.ts`, `types/rrTypes.ts` — domain-specific types
- `constants/index.ts` — status lists, leave types, ranking types, org structure constants

### Path Alias

`@/*` maps to the project root (configured in tsconfig.json).

## ESLint Notes

`no-explicit-any` is off. `react-hooks/exhaustive-deps` is off. Most formatting rules are disabled. `no-unused-vars` is enforced as error.
