-- Fields required by the Teachers Data Profile report (Reports > Data Profile)
-- that had no home on the employee record. Until now these were only captured on
-- hrm_ranking_applicants, so employees who never applied through a ranking had no
-- value at all. They are stored on hrm_pds because they are employee-declared,
-- self-service data — the same place civil status and government IDs already live.
--
-- The yes/no columns hold the plain strings 'Yes' / 'No' to match the convention
-- already used by hrm_ranking_applicants.disability / ethnicity / solo_parent.
alter table public.hrm_pds
  -- a. Basic Information
  add column if not exists religion text,
  -- e. Administrative Data
  add column if not exists deped_email text,
  -- f. Social Profile
  add column if not exists pwd text,
  add column if not exists pwd_detail text,
  add column if not exists ip_group text,
  add column if not exists ip_group_detail text,
  add column if not exists solo_parent text,
  add column if not exists solo_parent_detail text;
