-- Replacing a request's leave dates in one transaction.
--
-- components/Tracker/DetailsModal.tsx deleted every hrm_leave_dates row for the
-- request and then inserted the new set. If the insert failed the delete had
-- already committed, so the request was left with no leave dates at all -- the
-- toast said "Failed to update leave dates" while the old ones were already
-- destroyed. The tracker's leave_from/leave_to update was a third separate
-- statement that could also fail on its own.

CREATE OR REPLACE FUNCTION public.replace_leave_dates(
  p_tracker_id bigint,
  p_dates jsonb,
  p_leave_from text,
  p_leave_to text
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
      leave_to   = p_leave_to
  where id = p_tracker_id;

  if not found then
    raise exception 'Request % no longer exists', p_tracker_id;
  end if;

  return jsonb_build_object('inserted', v_inserted);
end;
$function$;
