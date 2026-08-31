-- What a revert would restore, computed by the database.
--
-- The revert confirmation modal showed a super admin the exact numbers that
-- reverting an approval would put back. It built them in the browser with its
-- own copy of the leave-credit type table -- a third copy, after the approval
-- and revert paths -- plus one query per hrm_leave_coc row, and it dropped the
-- errors from all of those queries, so a failed lookup silently displayed a
-- balance of 0 next to a real one.
--
-- Read-only: it reports, it never writes. Sharing one credit-type list with
-- revert_leave_approval is the point, so the preview cannot drift from what a
-- revert actually does.

CREATE OR REPLACE FUNCTION public.preview_leave_revert(p_tracker_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
declare
  v_tracker     hrm_request_trackers%rowtype;
  v_credits     jsonb;
  v_coc         jsonb := null;
  v_coc_rows    bigint;
  v_coc_restore numeric;
  v_coc_current numeric;
begin
  select * into v_tracker
  from hrm_request_trackers
  where id = p_tracker_id;

  if not found then
    return null;
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'type',           t.credit_type,
               'restore',        hrm_text_to_numeric(t.raw_value),
               'currentBalance', coalesce(lc.credits, 0),
               'newBalance',     coalesce(lc.credits, 0)
                                 + hrm_text_to_numeric(t.raw_value)
             )
             order by t.ord
           ),
           '[]'::jsonb
         )
  into v_credits
  from (values
    ( 1, 'Vacation Leave',                     v_tracker.leave_credit_use_vl),
    ( 2, 'Sick Leave',                         v_tracker.leave_credit_use_sl),
    ( 3, 'Service Credit',                     v_tracker.leave_credit_use_sc),
    ( 4, 'Adoption Leave',                     v_tracker.leave_credit_use_adoption),
    ( 5, '10-Day VAWC Leave',                  v_tracker.leave_credit_use_vawc),
    ( 6, 'Special Emergency (Calamity) Leave', v_tracker.leave_credit_use_emergency),
    ( 7, 'Study Leave',                        v_tracker.leave_credit_use_study),
    ( 8, 'Solo Parent Leave',                  v_tracker.leave_credit_use_soloparent),
    ( 9, 'Special Leave Benefits For Women',   v_tracker.leave_credit_use_slbw),
    (10, 'Special Privilege Leave',            v_tracker.leave_credit_use_spl),
    (11, 'Rehabilitation Leave',               v_tracker.leave_credit_use_rehab),
    (12, 'Paternity Leave',                    v_tracker.leave_credit_use_paternity),
    (13, 'Maternity Leave',                    v_tracker.leave_credit_use_maternity),
    (14, 'Wellness Break',                     v_tracker.leave_credit_use_wellness)
  ) as t(ord, credit_type, raw_value)
  left join hrm_leave_credits lc
    on lc.user_id = v_tracker.created_by
   and lc.type = t.credit_type
  where hrm_text_to_numeric(t.raw_value) > 0;

  -- One aggregate instead of a query per COC row.
  select count(*),
         coalesce(sum(hrm_text_to_numeric(lco.use_coc)), 0),
         coalesce(sum(cu.coc), 0)
  into v_coc_rows, v_coc_restore, v_coc_current
  from hrm_leave_coc lco
  left join hrm_cto_users cu on cu.id = lco.user_cto_id
  where lco.tracker_id = p_tracker_id;

  if v_coc_rows > 0 then
    v_coc := jsonb_build_object(
      'restore',    v_coc_restore,
      'currentCoc', v_coc_current,
      'newCoc',     v_coc_current + v_coc_restore
    );
  end if;

  return jsonb_build_object(
    'credits',             v_credits,
    'coc',                 v_coc,
    'leaveDaysWithoutPay', hrm_text_to_numeric(v_tracker.leave_days_without_pay)
  );
end;
$function$;
