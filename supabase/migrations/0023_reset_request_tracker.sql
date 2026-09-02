-- Resetting a request back to its opening stage, in one transaction.
--
-- Sits between the two paths that already exist. approve_leave_request
-- (migration 0015) moves a request forward; revert_leave_approval (0016)
-- steps it back one stage, from Approved to Approval Recommended, keeping the
-- certification so it can be re-approved as it stands. Neither helps when a
-- request has to start over: a leave certified against the wrong credit type,
-- a request disapproved by mistake, one stuck with the wrong verifier.
--
-- This takes a request at any stage past the opening one and returns it to
-- exactly what create_request_tracker (0019) leaves behind: For Verification,
-- forwarded to its original receiver, with the requester as current approver
-- and no certification attached.
--
-- Three things it deliberately does NOT do:
--
--   * It does not delete workflow history. hrm_tracker_flow and
--     hrm_tracker_logs are append-only here, so who approved, recommended and
--     certified the request stays on the record; the reset adds a new opening
--     pair on top and logs itself against it.
--   * It does not delete the hrm_service_records row a long leave without pay
--     creates, matching revert_leave_approval. The returned
--     needs_manual_service_record_check flag drives that message.
--   * It does not touch hrm_leave_dates. Those are the requester's own dates,
--     not part of the certification.
--
-- One asymmetry worth knowing: the leave form pre-fills leave_credit_use_*,
-- leave_days_with_pay/without_pay and credits_used from the requester's own
-- balances at filing time, and CreditsCertification then overwrites them. A
-- reset clears them rather than restoring the requester's original figures,
-- which are gone by then -- so the request comes back very slightly emptier
-- than a brand new one. That is the intended behaviour: certification is
-- meant to be redone from scratch, and CreditsCertification falls back to
-- live balances when credits_used is null.

CREATE OR REPLACE FUNCTION public.reset_request_tracker(
  p_tracker_id bigint,
  p_resetter_id uuid,
  p_lwop_min_days numeric DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_tracker       hrm_request_trackers%rowtype;
  v_credit        record;
  v_value         numeric;
  v_coc_expected  bigint;
  v_coc_updated   bigint;
  v_coc_total     numeric := 0;
  v_was_approved  boolean;
  v_manual_check  boolean := false;
  v_restored      text[] := '{}';
  v_receiver      uuid;
  v_flow_id       bigint;
  v_message       text;
begin
  -- Row lock rather than a WHERE-clause guard, because the decision about
  -- restoring credits depends on the status we are moving away from and so
  -- has to be read before it changes. A second, concurrent reset waits here,
  -- then finds a request already at its opening stage and restores nothing.
  select * into v_tracker
  from hrm_request_trackers
  where id = p_tracker_id
  for update;

  if not found then
    return jsonb_build_object('reset', false, 'reason', 'not_found');
  end if;

  if v_tracker.current_status = 'For Verification'
     and v_tracker.certified_by is null then
    return jsonb_build_object('reset', false, 'reason', 'already_initial');
  end if;

  -- approve_leave_request is the only thing that deducts balances, so only a
  -- request currently Approved has anything to give back. A certified but
  -- unapproved request never had its credits taken.
  v_was_approved := v_tracker.current_status = 'Approved';

  if v_was_approved and v_tracker.type is not distinct from 'Leave' then
    -- ------------------------------------------------------ restore credits
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
        -- In-place addition, so two resets of different requests for the same
        -- employee cannot lose one another's update.
        update hrm_leave_credits
        set credits = credits + v_value
        where user_id = v_tracker.created_by
          and type = v_credit.credit_type;

        -- Only report what a balance row actually took. A credit type with no
        -- row was never deducted at approval either, so there is nothing to
        -- give back and nothing to warn about.
        if found then
          v_restored := v_restored
                        || format('%s (%s)', v_credit.credit_type, v_value);
        end if;
      end if;
    end loop;

    -- ---------------------------------------------------------- restore COC
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
        returning coc_rows.use_coc
      )
      select count(*), coalesce(sum(use_coc), 0)
      into v_coc_updated, v_coc_total
      from updated;

      -- A COC row pointing at a missing hrm_cto_users record means the data is
      -- inconsistent, and carrying on would silently swallow the balance. Same
      -- guard as the approval and revert paths.
      if v_coc_updated <> v_coc_expected then
        raise exception
          'COC balance missing for % of % hrm_leave_coc rows on tracker %',
          v_coc_expected - v_coc_updated, v_coc_expected, p_tracker_id;
      end if;

      if v_coc_total > 0 then
        v_restored := v_restored || format('COC (%s)', v_coc_total);
      end if;
    end if;

    -- Undo the step increment bump, using the same threshold as the approval
    -- path so a reset cannot leave the bump in place.
    if hrm_text_to_numeric(v_tracker.leave_days_without_pay) >= p_lwop_min_days then
      v_manual_check := true;

      update hrm_users
      set step_increment_leave_days =
            greatest(0, coalesce(step_increment_leave_days, 0)
                        - hrm_text_to_numeric(v_tracker.leave_days_without_pay))
      where id = v_tracker.created_by;
    end if;
  end if;

  -- The leave card entry and the COC selections both belong to the
  -- certification being cleared. Unconditional: deleting rows that are not
  -- there is a no-op, and re-certifying writes both again.
  delete from hrm_leave_cards where tracker_id = p_tracker_id;
  delete from hrm_leave_coc   where tracker_id = p_tracker_id;

  -- Where the request is forwarded on a reset: the receiver it was originally
  -- filed to, not whoever holds it now after any number of forwards.
  v_receiver := coalesce(
    (select f.receiver_id
     from hrm_tracker_flow f
     where f.tracker_id = p_tracker_id
       and f.status = 'Forwarded'
       and f.receiver_id is not null
     order by f.id
     limit 1),
    v_tracker.receiver_id
  );

  -- Back to what create_request_tracker leaves behind. current_approver_id is
  -- the requester at filing time, not the person resetting.
  update hrm_request_trackers
  set current_status              = 'For Verification',
      current_tracker             = 'Forwarded',
      current_approver_id         = created_by,
      receiver_id                 = v_receiver,
      approved_by                 = null,
      date_approved               = null,
      recommended_by              = null,
      date_recommeded             = null,
      certified_by                = null,
      certification_as_of         = null,
      credits_used                = null,
      leave_credit_use_vl         = null,
      leave_credit_use_sl         = null,
      leave_credit_use_sc         = null,
      leave_credit_use_adoption   = null,
      leave_credit_use_vawc       = null,
      leave_credit_use_emergency  = null,
      leave_credit_use_study      = null,
      leave_credit_use_soloparent = null,
      leave_credit_use_slbw       = null,
      leave_credit_use_spl        = null,
      leave_credit_use_rehab      = null,
      leave_credit_use_paternity  = null,
      leave_credit_use_maternity  = null,
      leave_credit_use_wellness   = null,
      leave_days_with_pay         = null,
      leave_days_without_pay      = null
  where id = p_tracker_id;

  -- The opening pair again, on top of the existing history.
  insert into hrm_tracker_flow (tracker_id, user_id, status)
  values (p_tracker_id, p_resetter_id, 'For Verification')
  returning id into v_flow_id;

  v_message := format('Reset to For Verification from %s', v_tracker.current_status);

  if array_length(v_restored, 1) > 0 then
    v_message := v_message
                 || format(' (restored: %s)', array_to_string(v_restored, ', '));
  end if;

  if v_manual_check then
    v_message := v_message
                 || format(
                      ' (please manually review the Service Record entry for the >=%s days without pay adjustment)',
                      p_lwop_min_days
                    );
  end if;

  insert into hrm_tracker_logs (tracker_flow_id, user_id, message)
  values (v_flow_id, p_resetter_id, v_message);

  insert into hrm_tracker_flow (tracker_id, user_id, receiver_id, status)
  values (p_tracker_id, p_resetter_id, v_receiver, 'Forwarded');

  return jsonb_build_object(
    'reset', true,
    'previous_status', v_tracker.current_status,
    'restored_credits', to_jsonb(v_restored),
    'needs_manual_service_record_check', v_manual_check
  );
end;
$function$;
