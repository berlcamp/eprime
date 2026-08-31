-- Creating a request and its initial workflow rows in one transaction.
--
-- The six request forms (leave, travel, pass slip, locator slip, undertime,
-- service record print) each inserted the hrm_request_trackers row, then
-- inserted the two opening hrm_tracker_flow rows as a second statement. When
-- that second insert failed, the request already existed with no workflow at
-- all: invisible to every "forwarded to me" queue, and the toast told the user
-- saving had failed, so they filed it again and created a duplicate.
--
-- The leave form had a third statement on top of that -- the hrm_leave_dates
-- rows -- with the same exposure, so p_leave_dates joins the same transaction.
--
-- The column list is built from the payload's own keys, so each form keeps
-- sending only the fields it fills in. A key that is not a real column fails
-- here rather than being silently ignored.

CREATE OR REPLACE FUNCTION public.create_request_tracker(
  p_tracker jsonb,
  p_user_id uuid,
  p_receiver_id uuid,
  p_leave_dates jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_cols text;
  v_id   bigint;
  v_row  jsonb;
begin
  if p_tracker is null or jsonb_typeof(p_tracker) <> 'object' then
    raise exception 'p_tracker must be a JSON object';
  end if;

  select string_agg(format('%I', k), ', ')
  into v_cols
  from jsonb_object_keys(p_tracker) as k;

  if v_cols is null then
    raise exception 'p_tracker has no fields';
  end if;

  execute format(
    'insert into hrm_request_trackers (%s)
     select %s from jsonb_populate_record(null::hrm_request_trackers, $1)
     returning id',
    v_cols, v_cols
  )
  using p_tracker
  into v_id;

  if p_leave_dates is not null and jsonb_array_length(p_leave_dates) > 0 then
    insert into hrm_leave_dates (tracker_id, date, is_paid)
    select v_id,
           (d ->> 'date')::date,
           coalesce((d ->> 'is_paid')::boolean, true)
    from jsonb_array_elements(p_leave_dates) as d;
  end if;

  insert into hrm_tracker_flow (tracker_id, user_id, status)
  values (v_id, p_user_id, 'For Verification');

  insert into hrm_tracker_flow (tracker_id, user_id, receiver_id, status)
  values (v_id, p_user_id, p_receiver_id, 'Forwarded');

  select to_jsonb(t) into v_row
  from hrm_request_trackers t
  where t.id = v_id;

  return v_row;
end;
$function$;
