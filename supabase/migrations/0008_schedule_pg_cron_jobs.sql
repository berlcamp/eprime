-- Schedule the daily HRM cron jobs inside Postgres using pg_cron.
--
-- Previously these four RPCs were triggered over HTTP (/api/cronann) by a
-- GitHub Actions schedule, which was unreliable (POST/GET mismatch, silent
-- curl failures, GitHub disabling schedules after 60 days of inactivity).
-- pg_cron runs them directly in the database: no network hop, no auth
-- surface, and each job succeeds or fails independently.
--
-- Times are UTC (pg_cron always runs in UTC). 18:00 UTC = 2:00 AM UTC+8,
-- matching the old GitHub Actions schedule. Jobs are staggered 5 minutes
-- apart so they never contend with each other.
--
-- cron.schedule(jobname, ...) is an upsert: re-running this migration
-- replaces the existing job with the same name instead of duplicating it.
--
-- Monitoring:
--   select * from cron.job;                                         -- scheduled jobs
--   select * from cron.job_run_details order by start_time desc;    -- run history
-- To remove a job: select cron.unschedule('<jobname>');
--
-- The /api/cronann route is kept as a manual trigger (Settings → Cron Jobs).

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;

-- Monthly VL/SL increments (function is internally date-guarded; safe to run daily)
select cron.schedule(
  'hrm-increment-monthly-leave-credits',
  '0 18 * * *',
  $$select public.increment_monthly_leave_credits();$$
);

-- CTO expiration
select cron.schedule(
  'hrm-automate-cto-expiration',
  '5 18 * * *',
  $$select public.automate_cto_expiration();$$
);

-- Annual leave credits reset
select cron.schedule(
  'hrm-reset-annual-leave-credits',
  '10 18 * * *',
  $$select public.reset_annual_leave_credits();$$
);

-- NOSI processing
select cron.schedule(
  'hrm-process-nosi',
  '15 18 * * *',
  $$select public.process_nosi();$$
);
