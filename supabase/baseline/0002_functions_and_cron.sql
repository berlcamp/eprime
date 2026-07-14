-- =============================================================================
-- PRIME-HRM baseline schema (migration 2 of 2): functions + pg_cron schedule
-- Function bodies are the FIXED versions (see 0009_fix_cron_function_bugs.sql
-- in the old repo) pulled from the live database after the fixes were applied.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_monthly_leave_credits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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

CREATE OR REPLACE FUNCTION public.automate_cto_expiration()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
    -- Valid through the expiration date itself; expire only after it passes.
    update hrm_cto_users
    set status = 'Expired'
    where status is null
      and expiration < current_date;

    return;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reset_annual_leave_credits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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

CREATE OR REPLACE FUNCTION public.process_nosi()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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


-- ============================== pg_cron schedule ==============================
-- Times are UTC; 18:00 UTC = 2:00 AM Asia/Manila.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

select cron.schedule('hrm-increment-monthly-leave-credits', '0 18 * * *',
  $$select public.increment_monthly_leave_credits();$$);
select cron.schedule('hrm-automate-cto-expiration', '5 18 * * *',
  $$select public.automate_cto_expiration();$$);
select cron.schedule('hrm-reset-annual-leave-credits', '10 18 * * *',
  $$select public.reset_annual_leave_credits();$$);
select cron.schedule('hrm-process-nosi', '15 18 * * *',
  $$select public.process_nosi();$$);
