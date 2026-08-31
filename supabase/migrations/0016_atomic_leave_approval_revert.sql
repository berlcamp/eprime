-- Reverting an approved leave request in one transaction.
--
-- The mirror of approve_leave_request (migration 0015). The browser version in
-- components/Tracker/DetailsModal.tsx had the same partial-write problem, plus
-- one the approval path did not: it restored credits *before* flipping the
-- status back, and nothing checked that the request was still Approved. A
-- second revert -- a double click, or a stale modal -- therefore restored the
-- same credits again and inflated the employee's balance.
--
-- Here the status flip happens first and doubles as the guard: a second revert
-- matches no row and restores nothing.
--
-- Note this deliberately does NOT delete the hrm_service_records row that a
-- long leave-without-pay creates. That matches the previous behaviour, which
-- asked the approver to review it by hand; the returned
-- needs_manual_service_record_check flag drives that message.

CREATE OR REPLACE FUNCTION public.revert_leave_approval(
  p_tracker_id bigint,
  p_reverter_id uuid,
  p_lwop_min_days numeric DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_tracker       hrm_request_trackers%rowtype;
  v_flow_id       bigint;
  v_credit        record;
  v_value         numeric;
  v_coc_expected  bigint;
  v_coc_updated   bigint;
  v_manual_check  boolean := false;
  v_message       text;
begin
  -- Status flip first: this is the guard against reverting twice.
  update hrm_request_trackers
  set current_status      = 'Approval Recommended',
      current_approver_id = p_reverter_id,
      approved_by         = null,
      date_approved       = null
  where id = p_tracker_id
    and current_status = 'Approved'
  returning * into v_tracker;

  if not found then
    return jsonb_build_object('reverted', false, 'reason', 'not_revertable');
  end if;

  if v_tracker.type is not distinct from 'Leave' then
    -- ------------------------------------------------------- restore credits
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
        update hrm_leave_credits
        set credits = credits + v_value
        where user_id = v_tracker.created_by
          and type = v_credit.credit_type;
      end if;
    end loop;

    -- ----------------------------------------------------------- restore COC
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
        set coc      = cu.coc + coc_rows.use_coc,
            used_coc = greatest(0, coalesce(cu.used_coc, 0) - coc_rows.use_coc)
        from coc_rows
        where cu.id = coc_rows.user_cto_id
        returning 1
      )
      select count(*) into v_coc_updated from updated;

      if v_coc_updated <> v_coc_expected then
        raise exception
          'COC balance missing for % of % hrm_leave_coc rows on tracker %',
          v_coc_expected - v_coc_updated, v_coc_expected, p_tracker_id;
      end if;
    end if;

    -- Remove the leave card entry created during approval
    delete from hrm_leave_cards where tracker_id = p_tracker_id;

    -- Undo the step increment bump, using the same threshold as the approval
    -- path so a revert cannot leave the bump in place.
    if hrm_text_to_numeric(v_tracker.leave_days_without_pay) >= p_lwop_min_days then
      v_manual_check := true;

      update hrm_users
      set step_increment_leave_days =
            greatest(0, coalesce(step_increment_leave_days, 0)
                        - hrm_text_to_numeric(v_tracker.leave_days_without_pay))
      where id = v_tracker.created_by;
    end if;
  end if;

  -- Log against the most recent flow entry for this tracker.
  select id into v_flow_id
  from hrm_tracker_flow
  where tracker_id = p_tracker_id
  order by id desc
  limit 1;

  if v_flow_id is not null then
    v_message := case
      when v_manual_check then
        format(
          'Reverted to Approval Recommended (please manually review the Service Record entry for the >=%s days without pay adjustment)',
          p_lwop_min_days
        )
      else 'Reverted to Approval Recommended'
    end;

    insert into hrm_tracker_logs (tracker_flow_id, user_id, message)
    values (v_flow_id, p_reverter_id, v_message);
  end if;

  return jsonb_build_object(
    'reverted', true,
    'needs_manual_service_record_check', v_manual_check
  );
end;
$function$;
