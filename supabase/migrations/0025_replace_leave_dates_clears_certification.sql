-- A changed day count left the credit figures behind.
--
-- leave_days_with_pay, leave_days_without_pay and credits_used say how many of
-- a request's days are covered by credits and how many are not -- all computed
-- for the day count the request had at the time. Changing the dates afterwards
-- left them alone, so the modal showed "Absence with Pay: 1, without Pay: 0"
-- beside a five-day request, and approving it deducted credits for a day count
-- that no longer existed.
--
-- What the new count means for those figures depends on the request:
--
--   * Days added, credits not yet certified -- the credits already reserved
--     still stand and the added days are simply without pay, which is what the
--     modal computes as you type. Only the without-pay remainder is rewritten.
--   * Credits already certified, or the count dropped below the days those
--     credits cover -- the figures are a statement about a count that is gone,
--     so they are cleared exactly as reset_request_tracker clears them and the
--     credits have to be certified again.
--   * Count unchanged -- the dates moved but the figures still hold. Nothing
--     is touched.
--
-- An approved request is left alone in every case: its credits are already
-- deducted and revert_leave_approval reads these same columns to give them
-- back, so the approval has to be reverted first. The modal says so before
-- saving.

CREATE OR REPLACE FUNCTION public.replace_leave_dates(
  p_tracker_id bigint,
  p_dates jsonb,
  p_leave_from text,
  p_leave_to text,
  p_leave_days text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_inserted    bigint;
  v_tracker     hrm_request_trackers%rowtype;
  v_days        numeric;
  v_with_pay    numeric;
  v_changed     boolean;
  v_editable    boolean;
  v_keep_credits boolean;
  v_clear       boolean;
  v_new_with_pay    text;
  v_new_without_pay text;
begin
  select * into v_tracker
  from hrm_request_trackers
  where id = p_tracker_id
  for update;

  if not found then
    raise exception 'Request % no longer exists', p_tracker_id;
  end if;

  v_days     := hrm_text_to_numeric(p_leave_days);
  v_with_pay := hrm_text_to_numeric(v_tracker.leave_days_with_pay);
  v_changed  := v_days is distinct from hrm_text_to_numeric(v_tracker.leave_days);
  v_editable := v_tracker.current_status <> 'Approved';

  v_keep_credits := v_changed and v_editable
                    and v_tracker.certified_by is null
                    and v_days >= v_with_pay;
  v_clear        := v_changed and v_editable and not v_keep_credits;

  v_new_with_pay := case when v_clear then null
                         else v_tracker.leave_days_with_pay end;
  v_new_without_pay := case
                         when v_clear then null
                         when v_keep_credits then (v_days - v_with_pay)::text
                         else v_tracker.leave_days_without_pay
                       end;

  delete from hrm_leave_dates where tracker_id = p_tracker_id;

  insert into hrm_leave_dates (tracker_id, date, is_paid)
  select p_tracker_id,
         (d ->> 'date')::date,
         coalesce((d ->> 'is_paid')::boolean, true)
  from jsonb_array_elements(p_dates) as d;

  get diagnostics v_inserted = row_count;

  update hrm_request_trackers
  set leave_from = p_leave_from,
      leave_to   = p_leave_to,
      leave_days = p_leave_days,
      leave_days_with_pay    = v_new_with_pay,
      leave_days_without_pay = v_new_without_pay,
      certified_by                = case when v_clear then null
                                         else certified_by end,
      certification_as_of         = case when v_clear then null
                                         else certification_as_of end,
      credits_used                = case when v_clear then null
                                         else credits_used end,
      leave_credit_use_vl         = case when v_clear then null
                                         else leave_credit_use_vl end,
      leave_credit_use_sl         = case when v_clear then null
                                         else leave_credit_use_sl end,
      leave_credit_use_sc         = case when v_clear then null
                                         else leave_credit_use_sc end,
      leave_credit_use_adoption   = case when v_clear then null
                                         else leave_credit_use_adoption end,
      leave_credit_use_vawc       = case when v_clear then null
                                         else leave_credit_use_vawc end,
      leave_credit_use_emergency  = case when v_clear then null
                                         else leave_credit_use_emergency end,
      leave_credit_use_study      = case when v_clear then null
                                         else leave_credit_use_study end,
      leave_credit_use_soloparent = case when v_clear then null
                                         else leave_credit_use_soloparent end,
      leave_credit_use_slbw       = case when v_clear then null
                                         else leave_credit_use_slbw end,
      leave_credit_use_spl        = case when v_clear then null
                                         else leave_credit_use_spl end,
      leave_credit_use_rehab      = case when v_clear then null
                                         else leave_credit_use_rehab end,
      leave_credit_use_paternity  = case when v_clear then null
                                         else leave_credit_use_paternity end,
      leave_credit_use_maternity  = case when v_clear then null
                                         else leave_credit_use_maternity end,
      leave_credit_use_wellness   = case when v_clear then null
                                         else leave_credit_use_wellness end
  where id = p_tracker_id;

  return jsonb_build_object(
    'inserted', v_inserted,
    'certification_cleared', v_clear,
    'leave_days_with_pay', v_new_with_pay,
    'leave_days_without_pay', v_new_without_pay
  );
end;
$function$;
