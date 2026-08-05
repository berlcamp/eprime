-- Database-level backstop against duplicate plantilla items for the same
-- employee. The app already guards this in components/PlantillaDetails.tsx,
-- but a double-submit used to slip past it and insert two rows.
--
-- Partial index: vacant items (user_id IS NULL) are unconstrained, since any
-- number of items may sit unassigned.
--
-- NOTE: this fails if duplicates still exist. Run the cleanup first:
--   select user_id, count(*), array_agg(id order by created_at)
--   from hrm_items where user_id is not null
--   group by user_id having count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS hrm_items_user_id_unique
  ON hrm_items (user_id)
  WHERE user_id IS NOT NULL;
