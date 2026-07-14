-- Diagnosis history for Annual Physical Exams.
--
-- A Medical Officer can record MULTIPLE diagnoses for one APE record, each with its
-- own date (e.g. follow-up findings). Entries live in hrm_ape_diagnoses; the parent
-- hrm_annual_physical_exams row keeps fitness_result / medical_officer_remarks /
-- diagnosed_by / diagnosed_at (still used as the "locked for employee" marker).
--
-- The old single-value hrm_annual_physical_exams.diagnosis column is kept for
-- backward compatibility but the app now reads/writes hrm_ape_diagnoses.
create table if not exists public.hrm_ape_diagnoses (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  ape_id uuid not null references public.hrm_annual_physical_exams(id) on delete cascade,
  diagnosis text not null,
  diagnosis_date date not null default current_date,  -- date this diagnosis was made
  diagnosed_by uuid references public.hrm_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_ape_diagnoses_org on public.hrm_ape_diagnoses (org_id);
create index if not exists idx_ape_diagnoses_ape on public.hrm_ape_diagnoses (ape_id);

-- Backfill: copy existing single diagnoses into the history table.
insert into public.hrm_ape_diagnoses (org_id, ape_id, diagnosis, diagnosis_date, diagnosed_by, created_at)
select
  ape.org_id,
  ape.id,
  ape.diagnosis,
  coalesce(ape.diagnosed_at::date, current_date),
  ape.diagnosed_by,
  coalesce(ape.diagnosed_at, now())
from public.hrm_annual_physical_exams ape
where ape.diagnosis is not null
  and ape.diagnosis <> ''
  and not exists (
    select 1 from public.hrm_ape_diagnoses d where d.ape_id = ape.id
  );

-- Row Level Security. Consistent with the rest of the app, access is enforced in the
-- application layer; at the DB layer any authenticated user may read/write.
alter table public.hrm_ape_diagnoses enable row level security;

drop policy if exists "APE diagnoses authenticated all" on public.hrm_ape_diagnoses;
create policy "APE diagnoses authenticated all"
  on public.hrm_ape_diagnoses
  for all to authenticated using (true) with check (true);
