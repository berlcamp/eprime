-- Replacing a request's leave dates left the day count behind.
--
-- components/Tracker/DetailsModal.tsx lets a super admin replace a leave
-- request's dates, but only hrm_leave_dates and leave_from/leave_to were
-- written -- hrm_request_trackers.leave_days kept the count the request was
-- filed with. The details modal, the printed leave form and the reports then
-- showed a day count that disagreed with the dates printed beside it.
--
-- The count now moves with the dates, in the same transaction.
--
-- The four-argument function is dropped rather than overloaded: adding a
-- fifth argument with a default would leave two candidates for every
-- four-argument call, and Postgres rejects those as ambiguous.

DROP FUNCTION IF EXISTS public.replace_leave_dates(bigint, jsonb, text, text);

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
  v_inserted bigint;
begin
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
      leave_days = p_leave_days
  where id = p_tracker_id;

  if not found then
    raise exception 'Request % no longer exists', p_tracker_id;
  end if;

  return jsonb_build_object('inserted', v_inserted);
end;
$function$;
