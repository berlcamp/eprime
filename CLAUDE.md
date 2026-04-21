# CLAUDE.md — PRIME-HRM Next

Human Resource Management system for DepEd Division. Built with Next.js 14, Supabase, and TypeScript.

---

## Commands

```bash
npm run dev             # Start dev server (localhost:3000)
npm run build           # Production build
npm run lint            # ESLint
npm run generate:types  # Regenerate Supabase types from remote schema
```

No test framework is configured.

---

## Project Overview

**PRIME-HRM** is a comprehensive HR management system used by DepEd Division. It handles:

- **Request tracking** — Leave, locator slips, pass slips, travel authority, undertime, service record print requests
- **Employee & personnel management** — Profiles, assignments, designations, plantilla
- **Leave & time** — CTO (Compensatory Time Off), service credits, leave cards, leave certification
- **Ranking & selection (RSP)** — CAR-RQA, reclassification, applicant screening, IER (Intent to Engage in Research)
- **Learning & development (L&D)** — IDP, interventions, training programs, school personnels
- **Performance management (PMS)** — IPCRF, OPCRF, KRAs, objectives, competencies
- **Rewards & recognition (R&R)** — Service awards, meritorious awards, Gawad Agad
- **Records** — NOSA/NOSI, promotions, service records, registrations
- **Settings** — Districts, offices, schools, positions, announcements, salaries

---

## Tech Stack

| Category | Technologies |
|----------|---------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth with `@supabase/ssr`, `@supabase/supabase-js` |
| **State** | Redux Toolkit, React Context (`FilterContext`, `SupabaseProvider`) |
| **UI** | Tailwind CSS, Radix UI, Headless UI, Lucide React, Recharts |
| **Forms** | react-hook-form, @hookform/resolvers, zod |
| **Documents** | exceljs, jspdf, jspdf-autotable, xlsx, file-saver |
| **Print** | react-to-print |
| **Email** | Resend, Mailgun |
| **Other** | date-fns, axios, react-hot-toast, react-calendar, react-date-range, react-dropzone, cmdk |

---

## Module List with Descriptions

### Tracker Module
Request tracking for leave, locator slips, pass slips, travel, undertime, service record print requests.

| Component | Description |
|-----------|-------------|
| `components/Tracker/DetailsModal.tsx` | Main tracker request details modal |
| `components/Tracker/CreditsCertification.tsx` | Leave credits certification |
| `components/Tracker/StatusFlow.tsx` | Status flow visualization |
| `components/Tracker/UserRequests.tsx` | User request list |
| `components/Tracker/AddStickyModal.tsx` | Add sticky notes to requests |
| `components/Tracker/Remarks/` | Remarks, comments, lists |
| `app/(hr)/tracker/` | Tracker routes, forms (LeaveForm, TravelForm, etc.) |

### Printables Module
Print-ready components for official forms and documents.

| Component | Description |
|-----------|-------------|
| `components/Printables/PrintLeaveForm.tsx` | Leave form print |
| `components/Printables/PrintLocatorSlipForm.tsx` | Locator slip |
| `components/Printables/PrintPassSlipForm.tsx` | Pass slip |
| `components/Printables/PrintTravelForm.tsx` | Travel authority |
| `components/Printables/PrintUndertimeForm.tsx` | Undertime permit |
| `components/Printables/PrintAppointmentForm.tsx` | Appointment form |
| `components/Printables/PrintAdviseOrder.tsx` | Advise order |
| `components/Printables/PrintAssumption.tsx` | Assumption form |
| `components/Printables/PrintServiceRecord.tsx` | Service record |
| `components/Printables/PrintOathOfOffice.tsx` | Oath of office |
| `components/Printables/PrintHeader.tsx`, `PrintFooter.tsx` | Shared print header/footer |

### RSP (Ranking & Selection) Module
Ranking applicants, committees, evaluators, IER, RQA, reclassification.

| Component | Description |
|-----------|-------------|
| `app/(rsp)/ranking/RankingApplicants.tsx` | Applicant ranking |
| `app/(rsp)/ranking/RankingCommittees.tsx` | Committee setup |
| `app/(rsp)/ranking/RankingEvaluators.tsx` | Evaluators |
| `app/(rsp)/ranking/RankingCriterias.tsx` | Ranking criterias |
| `app/(rsp)/ranking/CastPoints.tsx` | Point casting |
| `app/(rsp)/ranking/Main.tsx` | Main ranking view |
| `components/Rsp/ApplicantDetails.tsx` | Applicant details |
| `components/Rsp/IerData.tsx` | IER data |
| `components/Rsp/ApplicantCommitteePoints.tsx` | Applicant committee points |
| `app/(rsp)/erfscreening/EquivalentUnits.tsx` | Equivalent units (ERF screening) |
| `components/Rsp/AdviseOrderModal.tsx`, `OathOfOfficeModal.tsx` | Modals for appointment docs |

### PDS (Personal Data Sheet) Module
Personal data sheet and related sections.

| Component | Description |
|-----------|-------------|
| `components/Pds/Pds.tsx` | Main PDS component |
| `components/Pds/PdsModal.tsx` | PDS modal |
| `components/Pds/PersonalInfo.tsx` | Personal info |
| `components/Pds/FamilyBackground.tsx` | Family background |
| `components/Pds/EducationalBackground.tsx` | Education |
| `components/Pds/WorkExperience.tsx` | Work experience |
| `components/Pds/Eligibility.tsx` | Eligibility |
| `components/Pds/Trainings.tsx` | Trainings |
| `components/Pds/VoluntaryWork.tsx` | Voluntary work |
| `components/Pds/References.tsx` | References |

### CTO / Service Credits / Leave Module
Compensatory time off, service credits, leave cards.

| Component | Description |
|-----------|-------------|
| `components/Cto/Cto.tsx` | CTO management |
| `components/Cto/UploadModal.tsx` | CTO upload |
| `components/ServiceCredits/ServiceCredits.tsx` | Service credits |
| `components/ServiceCredits/UploadModal.tsx` | Service credits upload |
| `components/LeaveCard/LeaveCard.tsx` | Leave card |
| `components/LeaveCard/LeaveBalanceBoxes.tsx` | Leave balance display |

### NOSA / NOSI Module
 notices of salary adjustment and implementation.

| Component | Description |
|-----------|-------------|
| `components/Nosa/Nosa.tsx` | NOSA management |
| `components/Nosi/` | NOSI components |

### Other Feature Components
- **Promotions** — `components/Promotions/Promotions.tsx`, `DetailsModal.tsx`, `UploadModal.tsx`
- **Profile** — `components/Profile/`, `ProfileDashboard.tsx`, `Plantilla.tsx`
- **Global Remarks** — `components/GlobalRemarks/`
- **Emails** — `components/Emails/` (Ranking, Qualified, IES, Registered templates)
- **Sidebars** — `Sidebars/HrSideBar.tsx`, `LandDSideBar.tsx`, `PmsSideBar.tsx`, `SettingsSideBar.tsx`

### UI Components
- `components/ui/` — shadcn/ui primitives (button, card, checkbox, dialog, input, select, etc.)
- `components/ui/extension/` — Extended UI components

---

## Folder Structure

```
prime-hrm-next/
├── app/                      # Next.js App Router
│   ├── (hr)/                 # HR routes (auth required)
│   │   ├── tracker/          # Request tracker
│   │   ├── employees/        # Employees
│   │   ├── personnels/       # Personnel
│   │   ├── profile/          # Profile & profile/[id]
│   │   ├── ctos/             # CTO
│   │   ├── servicecredits/   # Service credits
│   │   ├── registrations/    # Registrations
│   │   ├── assignments/      # Assignments
│   │   ├── designations/     # Designations
│   │   ├── servicerecords/   # Service records
│   │   ├── promotions/       # Promotions
│   │   ├── items/            # Items
│   │   ├── nosa/             # NOSA
│   │   ├── nosi/             # NOSI
│   │   ├── bulknosa/         # Bulk NOSA
│   │   └── reports/          # Reports (employees, requests, removed-employees)
│   ├── (rsp)/                # Ranking/selection (auth required)
│   │   ├── ranking/          # Ranking management
│   │   ├── rankingresults/   # Ranking results
│   │   ├── rankingier/       # IER
│   │   ├── rankingappointees/
│   │   ├── rankingexpensessummary/
│   │   ├── rankingturnaroundtime/
│   │   ├── applicants/       # Applicants
│   │   ├── openranking/     # Open ranking
│   │   ├── erfscreening/     # ERF screening
│   │   └── applyreclassification/
│   ├── (public)/            # Public (no auth)
│   │   ├── apply/           # Apply for positions
│   │   ├── applicantstatus/
│   │   ├── vacant/
│   │   ├── forgotpassword/
│   │   ├── reset-password/
│   │   ├── rankingapplicantresults/  # Various result views
│   │   └── rankingies/[applicantid]/
│   ├── landd/                # Learning & development
│   │   ├── idp/              # Individual development plan
│   │   ├── reports/
│   │   ├── schoolpersonnels/
│   │   ├── learningactionplan/
│   │   ├── externalserviceprovider/
│   │   ├── programmanagementteam/
│   │   ├── pooloffacilitators/
│   │   ├── implementedprogram/
│   │   ├── programproposal/
│   │   ├── trainingneedsassessment/
│   │   └── settings/
│   ├── pms/                  # Performance management
│   │   ├── ipcrf/            # IPCRF
│   │   │   └── [id]/rates, idp, summary
│   │   ├── opcrf/            # OPCRF
│   │   └── (settings)/      # KRAs, objectives, competencies, ipcrftemplates
│   ├── randr/                 # Rewards & recognition
│   │   ├── ranking/
│   │   ├── serviceawards/
│   │   ├── meritorious/
│   │   └── gawadagad/
│   ├── settings/             # System settings
│   │   ├── districts/
│   │   ├── offices/
│   │   ├── schools/
│   │   ├── positions/
│   │   ├── implementingunits/
│   │   ├── subjectssettings/
│   │   ├── coordinatorshipsettings/
│   │   ├── salaries/
│   │   ├── announcements/
│   │   ├── cron/
│   │   ├── errorlogs/
│   │   └── system/
│   ├── api/                  # API routes
│   │   ├── signup/
│   │   ├── updatepass/
│   │   ├── appointemail/
│   │   ├── applicantemail/
│   │   ├── ieremail/
│   │   ├── iesemail/
│   │   └── cronann/          # Cron (RPC calls)
│   ├── crontester/           # Cron testing
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
│
├── components/               # React components
│   ├── ui/                  # shadcn/ui primitives
│   ├── Tracker/             # Tracker (DetailsModal, CreditsCertification, StatusFlow, etc.)
│   ├── Pds/                 # Personal data sheet
│   ├── Printables/          # Print forms
│   ├── Emails/              # Email templates
│   ├── Sidebars/            # Navigation sidebars
│   ├── TopBars/             # Header/top bars
│   ├── Loading/             # Loading components
│   ├── LeaveCard/
│   ├── Cto/
│   ├── Nosa/
│   ├── Nosi/
│   ├── ServiceCredits/
│   ├── Promotions/
│   ├── Profile/
│   ├── GlobalRemarks/
│   ├── Rsp/                 # Ranking/selection components
│   ├── ServiceRecords/
│   ├── ipcrf/               # IPCRF components
│   └── ClientProviders.tsx  # Provider tree
│
├── constants/
│   └── index.ts             # All constants
│
├── context/
│   ├── SupabaseProvider.tsx # Supabase client & session
│   └── FilterContext.tsx    # Filters, perPage, hasAccess, setToast
│
├── GlobalRedux/
│   ├── provider.js
│   ├── store.ts
│   └── Features/
│       ├── listSlice.ts
│       ├── list2Slice.ts
│       ├── slowListSlice.ts
│       ├── remarksSlice.ts
│       ├── resultsCounterSlice.ts
│       └── recountSlice.ts
│
├── lib/
│   └── utils.ts             # cn(), isCtoExpired()
│
├── utils/                   # API/data layer
│   ├── supabase-server.ts   # createServerClient()
│   ├── supabase-browser.ts  # createBrowserClient()
│   ├── supabase-listener.js # Auth refresh → router.refresh()
│   ├── fetchApi.ts          # Main HRM fetch functions
│   ├── pmsApi.ts            # PMS/IPCRF
│   ├── landApi.ts           # L&D interventions
│   ├── data-helpers.ts      # CheckIfSchoolHead, etc.
│   ├── text-helper.ts       # fullTextQuery, formatToPesos, etc.
│   └── sideEffectFunctions.ts # NOSI/NOSA side effects
│
├── types/
│   ├── index.ts             # Main types
│   ├── pmsTypes.ts
│   ├── rrTypes.ts
│   └── landTypes.ts
│
└── supabase/                # Supabase config
```

---

## Coding Patterns and Conventions

### Component Patterns
- **AddEditModal** — Shared add/edit pattern; each feature typically has its own `AddEditModal.tsx`
- **Filters** — Per-page `Filters.tsx` for list filtering
- **DetailsModal** — Entity detail modal per feature
- **Page layout** — `page.tsx` + `Filters.tsx` + modals + list components
- **Printables** — React components for PDFs, used with `react-to-print`

### Naming Conventions
- Components: PascalCase
- Files: PascalCase for components, camelCase for utils
- Tables: `hrm_`, `pms_`, `rr_` prefixes
- Context hooks: `useSupabase()`, `useFilter()`

### Imports
- `@/` alias for root imports
- Common imports: `@/components`, `@/utils`, `@/constants`, `@/types`, `@/context`, `@/GlobalRedux`

### Data Access Patterns
- Direct `supabase.from()` in components for real-time or simple CRUD
- `fetchApi`, `pmsApi`, `landApi` for list pages with pagination and filters
- API routes use `createClient(supabaseUrl, serviceRoleKey)` for server-side operations bypassing RLS

### State Management
- **Redux** — List state: `list`, `list2`, `slowList`, `remarks`, `results`, `recount`. The store is created per-request via `makeStore()` in `GlobalRedux/store.ts` and wrapped with `useRef` in `provider.js`.
- **FilterContext** — Filters, perPage, access checks, toast, hasAccess, isSchoolHead
- **SupabaseProvider** — Supabase client, session, systemAccess, systemUsers, systemSchools, systemOffices

### Auth & Access
- `(hr)` and `(rsp)` layouts check session; redirect to `/` if missing
- `useFilter().hasAccess(type)` for feature-level access
- `superAdmins` in `constants/index.ts` for admin-only features
- All data is scoped by `NEXT_PUBLIC_ORG_ID`

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Root layout.tsx (server)                                                     │
│   - createServerClient()                                                     │
│   - getSession()                                                             │
│   - If session: fetch hrm_system_access, hrm_users, hrm_schools, hrm_offices │
│   - Pass to ClientProviders                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ClientProviders                                                              │
│   - SupabaseProvider(session, systemAccess, systemUsers, schools, offices)   │
│   - SupabaseListener (onAuthStateChange → router.refresh when session changes)│
│   - FilterProvider (when session exists)                                     │
│   - Redux Providers                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Pages / Components                                                           │
│   - useSupabase() → supabase, session, systemAccess, etc.                     │
│   - useFilter() → filters, setFilters, perPage, hasAccess, setToast, etc.   │
│   - Direct supabase.from().select/insert/update/delete                        │
│   - utils/fetchApi, pmsApi, landApi for paginated list/filter pages         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ API Routes (app/api/)                                                         │
│   - signup, updatepass, appointemail, applicantemail, ieremail, iesemail     │
│   - cronann: createClient(serviceRoleKey) → RPC (increment_monthly_leave_    │
│     credits, automate_cto_expiration, reset_annual_leave_credits, process_nosi)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Services & Database Access

### No dedicated `services/` folder
Data and side-effect logic live in `utils/`:

| File | Role |
|------|------|
| **utils/fetchApi.ts** | Main HRM data: districts, offices, positions, implementing units, schools, employees, personnels, assignments, items, announcements, subjects, coordinatorships, rankings, applicants, reclassifications, NOSA/NOSI, promotions, designations, registrations, CTOS, service credits, leave requests, documents, leave cards, error logs; `logError`, `handleConvertEmployeeToTeaching/NonTeaching` |
| **utils/pmsApi.ts** | `fetchKras`, `fetchObjectives`, `fetchIpcrfTemplates`, `fetchCompetencies`, `fetchIpcrfs`, `fetchDevelopmentPlans` |
| **utils/landApi.ts** | `fetchInteventions` (hrm_interventions) |
| **utils/sideEffectFunctions.ts** | NOSI/NOSA side effects (salary step updates, notifications) |
| **utils/data-helpers.ts** | `CheckIfSchoolHead`, school data helpers |
| **utils/text-helper.ts** | `fullTextQuery`, `capitalizeWords`, `formatToPesos`, `generateReferenceCode` |

### Supabase clients
- **Server:** `utils/supabase-server.ts` — `createServerClient()` with cookies
- **Browser:** `utils/supabase-browser.ts` — `createBrowserClient()` (used in fetchApi, context)
- **API (admin):** `createClient(url, serviceRoleKey)` in API routes

### Key tables
- **Core:** `hrm_users`, `hrm_system_access`, `hrm_schools`, `hrm_offices`, `hrm_positions`, `hrm_districts`, `hrm_registrations`
- **Tracker:** `hrm_request_trackers`, `hrm_tracker_flow`, `hrm_tracker_logs`, `hrm_tracker_followers`, `hrm_request_tracker_stickies`, `hrm_remarks`, `hrm_remarks_comments`, `hrm_leave_dates`, `hrm_leave_coc`
- **Leave:** `hrm_leave_credits`, `hrm_leave_cards`, `hrm_cto_users`, `hrm_ctos`
- **Records:** `hrm_service_records`, `hrm_service_credits`, `hrm_service_credit_users`, `hrm_promotions`, `hrm_assignments`, `hrm_designations`, `hrm_items`
- **Ranking:** `hrm_rankings`, `hrm_ranking_applicants`, `hrm_ranking_committees`, `hrm_ranking_evaluators`, etc.
- **PMS:** `kra`, `kra_objectives`, `ipcrf_templates`, `competencies`, `ipcrfs`, `hrm_development_plans`
- **L&D:** `hrm_interventions`
- **Storage:** `hrm` bucket for documents/attachments

### RPC functions (cron)
- `increment_monthly_leave_credits`
- `automate_cto_expiration`
- `reset_annual_leave_credits`
- `process_nosi`

---

## Constants Summary

From `constants/index.ts`:

| Export | Description |
|--------|-------------|
| `PER_PAGE` | Default pagination (25) |
| `statusList` | Status display config (Disapproved, For Verification, Approval Recommended, Approved) |
| `requestTypes` | Tracker request types |
| `leaveCreditTypes` | Leave credit rules by position/gender |
| `rankingTypes` | CAR-RQA, CAR (Teaching/Non-teaching), Reclassification |
| `majors`, `elementaryMajors`, `jhsMajors`, `shsMajors` | Education majors |
| `leaveTypes` | Leave type list |
| `interventions` | L&D interventions |
| `superAdmins` | Super admin email list |
| `orgChart` | Org chart structure |

---

## Hooks

No dedicated `hooks/` folder. Hooks come from context:

| Hook | Source | Purpose |
|------|--------|---------|
| `useSupabase()` | `context/SupabaseProvider.tsx` | Supabase client, session, systemAccess, systemUsers, systemSchools, systemOffices |
| `useFilter()` | `context/FilterContext.tsx` | filters, setFilters, perPage, hasAccess, setToast, isSchoolHead, etc. |

---

## ESLint Notes

- `no-explicit-any` is off
- `react-hooks/exhaustive-deps` is off
- Most formatting rules are disabled
- `no-unused-vars` is enforced as error
