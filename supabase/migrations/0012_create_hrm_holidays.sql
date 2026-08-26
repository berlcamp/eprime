-- Holiday calendar maintained from Settings > Holidays.
--
-- Dates in this table are skipped when counting leave days, but only for
-- leave that is counted in working days. Calendar-day leaves (Maternity,
-- Adoption, SLBW, Rehabilitation, Study) run straight through holidays --
-- RA 11210's 105 days means 105 straight days -- so they are unaffected.
--
-- Rows are stored per year rather than as recurring rules: Malacanang moves
-- the list by proclamation every year, and Eid'l Fitr / Eid'l Adha / National
-- Heroes' Day never land on a fixed date.
CREATE TABLE IF NOT EXISTS hrm_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Regular Holiday',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per date; the settings UI relies on this to reject duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS hrm_holidays_date_unique ON hrm_holidays (date);
