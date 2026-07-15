-- Optional file attachments for a single APE diagnosis entry.
--
-- A Medical Officer may attach any number of images/PDFs to each diagnosis they
-- record (lab results, x-ray plates, referral letters). Files live in the "hrm"
-- storage bucket under ape_diagnoses/{diagnosis_id}/{file_name} -- deliberately
-- outside annual_physical_exams/{ape_id}/, which is listed as the employee's own
-- exam attachments.
create table if not exists public.hrm_ape_diagnosis_files (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  diagnosis_id uuid not null references public.hrm_ape_diagnoses(id) on delete cascade,
  file_name text not null,   -- display name
  file_path text not null,   -- full path within the "hrm" bucket
  uploaded_by uuid references public.hrm_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_ape_diagnosis_files_org on public.hrm_ape_diagnosis_files (org_id);
create index if not exists idx_ape_diagnosis_files_diagnosis on public.hrm_ape_diagnosis_files (diagnosis_id);

-- Row Level Security. Consistent with the rest of the app, access is enforced in the
-- application layer; at the DB layer any authenticated user may read/write.
alter table public.hrm_ape_diagnosis_files enable row level security;

drop policy if exists "APE diagnosis files authenticated all" on public.hrm_ape_diagnosis_files;
create policy "APE diagnosis files authenticated all"
  on public.hrm_ape_diagnosis_files
  for all to authenticated using (true) with check (true);
