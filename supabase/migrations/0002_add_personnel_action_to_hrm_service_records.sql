-- Adds CSC-standard Personnel Action column to hrm_service_records
-- (CS Form No. 211: e.g. Original Appointment, Promotion, Step Increment, etc.)
alter table public.hrm_service_records
  add column if not exists personnel_action text;
