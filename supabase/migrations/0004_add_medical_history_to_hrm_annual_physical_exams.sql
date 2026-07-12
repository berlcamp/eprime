-- Store the employee-completed DepEd "Medical History" form as a JSON document.
-- This form is filled out by the employee when creating an Annual Physical Exam
-- record, prior to the physical examination, for review by the examining
-- practitioner (Medical Officer). The full form (header, present health status,
-- personal history, social history, OB-Gyn history) is captured under a single
-- jsonb column to avoid a wide, sparse schema. The Medical Officer still records
-- the structured fitness_result + diagnosis on the same row.
alter table public.hrm_annual_physical_exams
  add column if not exists medical_history jsonb;
