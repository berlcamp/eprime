-- Approving a leave request in one transaction.
--
-- components/Tracker/DetailsModal.tsx ran this as ~10 separate statements from
-- the browser: it flipped the tracker to Approved first, then deducted leave
-- credits, then COC balances, then wrote the leave card and (for LWOP) the
-- service record. Three things went wrong with that:
--
--   1. Any failure after the first statement left the request marked Approved
--      with credits only partially deducted, and the surrounding JS catch
--      swallowed the error, so nobody found out.
--   2. Credits were deducted read-modify-write (read the balance, subtract in
--      JS, write the absolute result), which loses one of two overlapping
--      approvals for the same employee.
--   3. COC balances were updated with one round trip per hrm_leave_coc row.
--
-- Everything below happens in a single transaction with in-place arithmetic.
-- The function is SECURITY INVOKER (the default) on purpose: it runs under the
-- caller's JWT and the same RLS policies that applied when the browser issued
-- these statements directly.

-- Leave amounts are stored as text and dirty values must not abort an
-- approval, so anything non-numeric reads as zero.
CREATE OR REPLACE FUNCTION public.hrm_text_to_numeric(p_value text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_value ~ '^\s*[0-9]+(\.[0-9]+)?\s*$' THEN btrim(p_value)::numeric
    ELSE 0
  END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_leave_request(
  p_tracker_id bigint,
  p_approver_id uuid,
  p_org_id bigint,
  p_lwop_min_days numeric DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_tracker        hrm_request_trackers%rowtype;
  v_flow_id        bigint;
  v_total_credits  numeric := 0;
  v_used_credits   text[]  := '{}';
  v_untracked      text[]  := '{}';
  v_credit         record;
  v_value          numeric;
  v_coc_expected   bigint;
  v_coc_updated    bigint;
  v_from           text;
  v_designation    text;
begin
  -- Only a request still awaiting approval may be approved. This WHERE clause
  -- is the concurrency guard: a second, concurrent approval matches no row and
  -- so cannot deduct the same credits twice.
  update hrm_request_trackers
  set current_status      = 'Approved',
      current_approver_id = p_approver_id,
      approved_by         = p_approver_id,
      date_approved       = current_date
  where id = p_tracker_id
    and current_status = 'Approval Recommended'
  returning * into v_tracker;

  if not found then
    return jsonb_build_object('approved', false, 'reason', 'not_approvable');
  end if;

  -- Log against the most recent flow entry for this tracker.
  select id into v_flow_id
  from hrm_tracker_flow
  where tracker_id = p_tracker_id
  order by id desc
  limit 1;

  if v_flow_id is not null then
    insert into hrm_tracker_logs (tracker_flow_id, user_id, message)
    values (v_flow_id, p_approver_id, 'Approved');
  end if;

  if v_tracker.type is distinct from 'Leave' then
    return jsonb_build_object('approved', true, 'total_credits', 0);
  end if;

  -- ---------------------------------------------------------------- credits
  for v_credit in
    select *
    from (values
      ('Vacation Leave',                     v_tracker.leave_credit_use_vl),
      ('Sick Leave',                         v_tracker.leave_credit_use_sl),
      ('Service Credit',                     v_tracker.leave_credit_use_sc),
      ('Adoption Leave',                     v_tracker.leave_credit_use_adoption),
      ('10-Day VAWC Leave',                  v_tracker.leave_credit_use_vawc),
      ('Special Emergency (Calamity) Leave', v_tracker.leave_credit_use_emergency),
      ('Study Leave',                        v_tracker.leave_credit_use_study),
      ('Solo Parent Leave',                  v_tracker.leave_credit_use_soloparent),
      ('Special Leave Benefits For Women',   v_tracker.leave_credit_use_slbw),
      ('Special Privilege Leave',            v_tracker.leave_credit_use_spl),
      ('Rehabilitation Leave',               v_tracker.leave_credit_use_rehab),
      ('Paternity Leave',                    v_tracker.leave_credit_use_paternity),
      ('Maternity Leave',                    v_tracker.leave_credit_use_maternity),
      ('Wellness Break',                     v_tracker.leave_credit_use_wellness)
    ) as t(credit_type, raw_value)
  loop
    v_value := hrm_text_to_numeric(v_credit.raw_value);

    if v_value > 0 then
      -- In-place subtraction, so overlapping approvals cannot lose an update.
      update hrm_leave_credits
      set credits = credits - v_value
      where user_id = v_tracker.created_by
        and type = v_credit.credit_type;

      if not found then
        -- No balance row of this type (Service Credit, for one, lives in its
        -- own table). The old code skipped these silently; the caller is told
        -- now, but the approval still stands so behaviour is unchanged.
        v_untracked := v_untracked || v_credit.credit_type;
      end if;

      -- Counted whether or not a balance row existed, matching the leave card
      -- totals the old code wrote.
      v_total_credits := v_total_credits + v_value;
      v_used_credits  := v_used_credits
                         || format('%s (%s)', v_credit.credit_type, v_credit.raw_value);
    end if;
  end loop;

  -- -------------------------------------------------------------------- COC
  select count(*) into v_coc_expected
  from hrm_leave_coc
  where tracker_id = p_tracker_id;

  if v_coc_expected > 0 then
    with coc_rows as (
      select user_cto_id,
             hrm_text_to_numeric(use_coc) as use_coc
      from hrm_leave_coc
      where tracker_id = p_tracker_id
    ),
    updated as (
      update hrm_cto_users cu
      set coc      = cu.coc - coc_rows.use_coc,
          used_coc = coalesce(cu.used_coc, 0) + coc_rows.use_coc
      from coc_rows
      where cu.id = coc_rows.user_cto_id
      returning coc_rows.use_coc
    )
    select count(*), coalesce(sum(use_coc), 0)
    into v_coc_updated, v_value
    from updated;

    -- A COC row pointing at a missing hrm_cto_users record means the data is
    -- inconsistent. The old code raised here too, but only after it had
    -- already committed the credit deductions; now the whole approval rolls
    -- back.
    if v_coc_updated <> v_coc_expected then
      raise exception
        'COC balance missing for % of % hrm_leave_coc rows on tracker %',
        v_coc_expected - v_coc_updated, v_coc_expected, p_tracker_id;
    end if;

    v_total_credits := v_total_credits + v_value;
    v_used_credits  := v_used_credits || format('COC (%s)', v_value);
  end if;

  -- ------------------------------------------------------------- leave card
  insert into hrm_leave_cards (
    adjustment_date, particulars, remarks, credits_used, balance,
    absence_with_pay, absence_without_pay, type, tracker_id, user_id
  )
  values (
    current_date,
    'Leave Request',
    'Credit used:  ' || array_to_string(v_used_credits, ', '),
    v_total_credits::text,
    '',
    greatest(0, hrm_text_to_numeric(v_tracker.leave_days_with_pay))::text,
    v_tracker.leave_days_without_pay,
    v_tracker.leave_type,
    v_tracker.id,
    v_tracker.created_by
  );

  -- ------------------------------------------------ leave without pay (LWOP)
  if hrm_text_to_numeric(v_tracker.leave_days_without_pay) >= p_lwop_min_days then
    select date::text into v_from
    from hrm_leave_dates
    where tracker_id = p_tracker_id
    order by id
    limit 1;

    select p.name into v_designation
    from hrm_users u
    left join hrm_positions p on p.id = u.position_id
    where u.id = v_tracker.created_by;

    insert into hrm_service_records (
      user_id, org_id, "from", designation, days_without_pay, remarks, created_by
    )
    values (
      v_tracker.created_by,
      p_org_id,
      coalesce(v_from, ''),
      v_designation,
      v_tracker.leave_days_without_pay,
      v_tracker.leave_type,
      p_approver_id
    );

    update hrm_users
    set step_increment_leave_days =
          coalesce(step_increment_leave_days, 0)
          + hrm_text_to_numeric(v_tracker.leave_days_without_pay)
    where id = v_tracker.created_by;
  end if;

  return jsonb_build_object(
    'approved', true,
    'total_credits', v_total_credits,
    'used_credits', to_jsonb(v_used_credits),
    'untracked_credit_types', to_jsonb(v_untracked)
  );
end;
$function$;
