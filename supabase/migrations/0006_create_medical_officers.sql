-- Physical Exam Manager vs. Medical Officers.
--
-- The old hrm_system_access type 'medical_officer' is renamed to 'physical_exam_manager'.
-- A Physical Exam Manager can view ALL Annual Physical Exams (org-wide), record
-- diagnoses, and manage the list of Medical Officers.
--
-- A Medical Officer is a user assigned (by a manager) to one or more schools. When a
-- Medical Officer opens the Annual Physical Exams page they only see exams submitted by
-- employees belonging to their assigned school(s).

-- 1) Rename the existing access role.
update public.hrm_system_access
  set type = 'physical_exam_manager'
  where type = 'medical_officer';

-- 2) Medical Officers (a user flagged as a medical officer for an org).
create table if not exists public.hrm_medical_officers (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  user_id uuid not null references public.hrm_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists idx_medical_officers_org  on public.hrm_medical_officers (org_id);
create index if not exists idx_medical_officers_user on public.hrm_medical_officers (user_id);

-- 3) Schools assigned to a Medical Officer (many schools per officer).
create table if not exists public.hrm_medical_officer_schools (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  medical_officer_id uuid not null references public.hrm_medical_officers(id) on delete cascade,
  school_id bigint not null references public.hrm_schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (medical_officer_id, school_id)
);

create index if not exists idx_mo_schools_officer on public.hrm_medical_officer_schools (medical_officer_id);
create index if not exists idx_mo_schools_school  on public.hrm_medical_officer_schools (school_id);

-- Row Level Security. Consistent with the rest of the app, access is enforced in the
-- application layer; at the DB layer any authenticated user may read/write.
alter table public.hrm_medical_officers enable row level security;
alter table public.hrm_medical_officer_schools enable row level security;

drop policy if exists "MO authenticated all" on public.hrm_medical_officers;
create policy "MO authenticated all"
  on public.hrm_medical_officers
  for all to authenticated using (true) with check (true);

drop policy if exists "MO schools authenticated all" on public.hrm_medical_officer_schools;
create policy "MO schools authenticated all"
  on public.hrm_medical_officer_schools
  for all to authenticated using (true) with check (true);
