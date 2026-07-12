-- The examining practitioner (Medical Officer) records a free-text "Remarks"
-- in addition to the structured fitness_result and diagnosis, matching the
-- DepEd Medical History form which has separate physician "Diagnosis" and
-- "Remarks" fields. This is distinct from the employee's own `remarks` note.
alter table public.hrm_annual_physical_exams
  add column if not exists medical_officer_remarks text;
