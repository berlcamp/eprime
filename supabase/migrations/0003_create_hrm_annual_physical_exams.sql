-- Annual Physical Exam (APE) records uploaded by employees.
-- An employee may have multiple APE records per year (distinguished by exam_date).
-- A Medical Officer (hrm_system_access type = 'medical_officer') records a structured
-- fitness_result plus free-text diagnosis. A row is considered "diagnosed" (and locked
-- for the employee) once diagnosed_at is set.
create table if not exists public.hrm_annual_physical_exams (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  hrm_user_id uuid not null references public.hrm_users(id) on delete cascade,
  exam_date date not null,               -- date of the physical exam
  remarks text,                          -- optional employee note
  fitness_result text,                   -- 'Fit' | 'Fit with conditions' | 'Unfit' (Medical Officer)
  diagnosis text,                        -- Medical Officer notes
  diagnosed_by uuid references public.hrm_users(id),
  diagnosed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ape_org  on public.hrm_annual_physical_exams (org_id);
create index if not exists idx_ape_user on public.hrm_annual_physical_exams (hrm_user_id);

-- Row Level Security.
-- Access is enforced in the app (profile ownership + medical_officer permission +
-- lock-after-diagnosis); at the DB layer we simply allow any authenticated user to
-- read/write, consistent with how the rest of the app talks to Supabase.
alter table public.hrm_annual_physical_exams enable row level security;

drop policy if exists "APE authenticated select" on public.hrm_annual_physical_exams;
create policy "APE authenticated select"
  on public.hrm_annual_physical_exams
  for select to authenticated using (true);

drop policy if exists "APE authenticated insert" on public.hrm_annual_physical_exams;
create policy "APE authenticated insert"
  on public.hrm_annual_physical_exams
  for insert to authenticated with check (true);

drop policy if exists "APE authenticated update" on public.hrm_annual_physical_exams;
create policy "APE authenticated update"
  on public.hrm_annual_physical_exams
  for update to authenticated using (true) with check (true);

drop policy if exists "APE authenticated delete" on public.hrm_annual_physical_exams;
create policy "APE authenticated delete"
  on public.hrm_annual_physical_exams
  for delete to authenticated using (true);
