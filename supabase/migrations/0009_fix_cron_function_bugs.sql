-- Bug fixes for the four cron functions (scheduled via pg_cron in 0008).
--
-- Fixes:
--
--   increment_monthly_leave_credits
--     * Only accrue for Active employees (hrm_users.status = 'Active');
--       removed/resigned employees were accruing 1.25 VL/SL forever.
--     * 'FMMonth YYYY' label format — 'Month' blank-pads to 9 chars, producing
--       remarks like "May       2025 increment".
--     * Leave-card balance now taken from UPDATE ... RETURNING (live value)
--       instead of the loop's earlier snapshot.
--   automate_cto_expiration
--     * A CTO is valid THROUGH its expiration date, matching isCtoExpired()
--       in lib/utils.ts: expire when expiration < today (was <=, which
--       stole the last valid day).
--   reset_annual_leave_credits
--     * Leave-card insert was missing the "type" column, so yearly-reset
--       entries were invisible to anything filtering leave cards by type.
--       Also now writes a remarks label.
--   process_nosi
--     * Only process Active employees.
--     * effective_date / next 3-year anniversary are based on the actual due
--       date (date_of_next_step_increment), not the day the cron happened to
--       run — late runs no longer drift anniversaries forward.
--     * Employees already at step 8 no longer get a junk NOSI row with NULL
--       new_amount; their schedule is just cleared.
--     * Missing hrm_salaries rows are skipped with a WARNING instead of
--       silently inserting NOSI records with NULL amounts.
--     * step_increment_leave_days resets to 0 once applied, so the same
--       leave-without-pay days no longer defer every future cycle.
--     * Per-employee error handling: one bad row logs a WARNING instead of
--       aborting NOSI processing for everyone.
--     * Due-date check is now <= (was <, which processed a day late).
--
-- Also includes two small data repairs at the bottom (premature CTO
-- expirations, and backfilling "type" on old yearly-reset leave cards).

-- ---------------------------------------------------------------------------
-- Monthly VL/SL increments
-- ---------------------------------------------------------------------------
create or replace function public.increment_monthly_leave_credits()
returns void
language plpgsql
as $function$
declare
    updated_record record;
    last_increment date;
    new_increment date;
    new_balance numeric;
    increment_label text;
begin
    for updated_record in
        select lc.id, lc.user_id, lc.type, lc.date_of_next_increment
        from hrm_leave_credits as lc
        join hrm_users as e on lc.user_id = e.id
        where e.status = 'Active'
          and (e.position_type = 'Non-teaching' or e.position_type = 'Teaching-Related')
          and lc.type in ('Sick Leave', 'Vacation Leave')
          and lc.date_of_next_increment <= current_date
    loop
        last_increment := updated_record.date_of_next_increment;
        new_increment := last_increment + interval '1 month';

        -- e.g. "August 2025 increment" (FM = no blank padding)
        increment_label := to_char(last_increment, 'FMMonth YYYY') || ' increment';

        update hrm_leave_credits
        set credits = credits + 1.25,
            date_of_next_increment = new_increment
        where id = updated_record.id
        returning credits into new_balance;

        insert into hrm_leave_cards
            (user_id, particulars, credits_earned, balance, type, "from", "to", created_at, remarks)
        values (
            updated_record.user_id,
            case when updated_record.type = 'Sick Leave'
                 then 'Auto increment for SL'
                 else 'Auto increment for VL'
            end,
            '1.250',
            new_balance,
            updated_record.type,
            last_increment,
            new_increment,
            now(),
            increment_label
        );
    end loop;

    return;
end;
$function$;

-- ---------------------------------------------------------------------------
-- CTO expiration
-- ---------------------------------------------------------------------------
create or replace function public.automate_cto_expiration()
returns void
language plpgsql
as $function$
begin
    -- Valid through the expiration date itself; expire only after it passes.
    update hrm_cto_users
    set status = 'Expired'
    where status is null
      and expiration < current_date;

    return;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Annual leave credits reset
-- ---------------------------------------------------------------------------
create or replace function public.reset_annual_leave_credits()
returns void
language plpgsql
as $function$
declare
    rec record;
begin
    -- Reset credits and capture affected rows atomically.
    for rec in
        update hrm_leave_credits
        set
            credits = case
                when type = 'Maternity Leave' then 105
                when type = 'Paternity Leave' then 7
                when type = 'Special Privilege Leave' then 3
                when type = 'Solo Parent Leave' then 7
                when type = 'Study Leave' then 182
                when type = '10-Day VAWC Leave' then 10
                when type = 'Rehabilitation Privilege' then 182
                when type = 'Special Leave Benefits for Women' then 60
                when type = 'Special Emergency (Calamity) Leave' then 5
                when type = 'Adoption Leave' then 60
                when type = 'Wellness Break' then 5
                else credits
            end,
            date_of_next_reset =
                date_trunc('year', current_date) + interval '1 year'
        where date_of_next_reset <= current_date
          and type in (
              'Maternity Leave',
              'Paternity Leave',
              'Special Privilege Leave',
              'Solo Parent Leave',
              'Study Leave',
              '10-Day VAWC Leave',
              'Rehabilitation Privilege',
              'Special Leave Benefits for Women',
              'Special Emergency (Calamity) Leave',
              'Adoption Leave',
              'Wellness Break'
          )
        returning user_id, type, credits
    loop
        -- One leave card per reset record ("type" was previously omitted).
        insert into hrm_leave_cards
            (user_id, particulars, credits_earned, balance, type, "from", "to", created_at, remarks)
        values (
            rec.user_id,
            rec.type || ' yearly reset',
            rec.credits,
            rec.credits,
            rec.type,
            date_trunc('year', current_date),
            current_date,
            current_date,
            to_char(current_date, 'FMYYYY') || ' annual reset'
        );
    end loop;

    return;
end;
$function$;

-- ---------------------------------------------------------------------------
-- NOSI (step increment) processing
-- ---------------------------------------------------------------------------
create or replace function public.process_nosi()
returns void
language plpgsql
as $function$
declare
    user_record record;
    today date := current_date;
    due_date date;
    new_date_of_next_step date;
    previous_salary_amount float4;
    new_salary_amount float4;
    leave_days integer;
begin
    for user_record in
        select id,
               salary_step::integer as salary_step,
               salary_grade::integer as salary_grade,
               date_of_next_step_increment,
               step_increment_leave_days
        from hrm_users
        where status = 'Active'
          and date_of_next_step_increment <= today
    loop
        begin
            due_date := user_record.date_of_next_step_increment;

            -- Already at max step: clear the schedule, no NOSI record.
            if user_record.salary_step >= 8 then
                update hrm_users
                set date_of_next_step_increment = null
                where id = user_record.id;
                continue;
            end if;

            select salary into previous_salary_amount
            from hrm_salaries
            where grade = user_record.salary_grade
              and step = user_record.salary_step
              and is_active = 'yes';
            if not found then
                raise warning
                    'process_nosi: no active salary for grade % step % (user %); skipped',
                    user_record.salary_grade, user_record.salary_step, user_record.id;
                continue;
            end if;

            select salary into new_salary_amount
            from hrm_salaries
            where grade = user_record.salary_grade
              and step = user_record.salary_step + 1
              and is_active = 'yes';
            if not found then
                raise warning
                    'process_nosi: no active salary for grade % step % (user %); skipped',
                    user_record.salary_grade, user_record.salary_step + 1, user_record.id;
                continue;
            end if;

            -- Next anniversary is anchored to the due date, not the run date,
            -- so late runs don't drift the 3-year cycle.
            leave_days := coalesce(user_record.step_increment_leave_days, 0);
            new_date_of_next_step := due_date + interval '3 years';
            if leave_days >= 90 then
                new_date_of_next_step :=
                    new_date_of_next_step + (leave_days || ' days')::interval;
            end if;

            insert into hrm_nosi (
                user_id,
                effective_date,
                as_of_date,
                new_amount,
                new_grade,
                new_step,
                date,
                previous_grade,
                previous_step,
                previous_amount
            ) values (
                user_record.id,
                due_date,
                due_date - interval '1 day',
                new_salary_amount,
                user_record.salary_grade,
                user_record.salary_step + 1,
                today,
                user_record.salary_grade,
                user_record.salary_step,
                previous_salary_amount
            );

            update hrm_users
            set salary_step = user_record.salary_step + 1,
                date_of_next_step_increment = new_date_of_next_step,
                step_increment_leave_days = 0
            where id = user_record.id;
        exception
            when others then
                -- Keep processing the rest; failures show up in
                -- cron.job_run_details / postgres logs.
                raise warning 'process_nosi: user % failed: %',
                    user_record.id, sqlerrm;
        end;
    end loop;

    return;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Data repairs
-- ---------------------------------------------------------------------------

-- CTOs marked Expired prematurely under the old <= rule (still within their
-- valid window today) go back to active.
update hrm_cto_users
set status = null
where status = 'Expired'
  and expiration >= current_date;

-- Old yearly-reset leave cards were written without "type"; recover it from
-- the particulars text ("<type> yearly reset").
update hrm_leave_cards
set type = replace(particulars, ' yearly reset', '')
where type is null
  and particulars like '% yearly reset';
