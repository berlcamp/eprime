-- Creating a ranking applicant together with its opening flow row.
--
-- app/(rsp)/applyreclassification/page.tsx inserted the applicant, then the
-- notification, then the flow row, as three statements. A failure on the
-- second or third left an application with no flow row -- invisible to the
-- ERF screening queues -- and the first failure branch did not even raise a
-- toast, so the applicant saw nothing happen at all and the Save button stayed
-- disabled.
--
-- Applicant and flow row are one transaction here. The notification stays
-- outside it on purpose: it is how the approving officer is told, but if it
-- fails the application itself still stands and is still in the queue, so it
-- must not roll the application back.

CREATE OR REPLACE FUNCTION public.create_ranking_applicant(
  p_applicant jsonb,
  p_user_id uuid,
  p_receiver_id uuid,
  p_flow_status text DEFAULT 'Forwarded'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_cols text;
  v_id   bigint;
  v_row  jsonb;
begin
  if p_applicant is null or jsonb_typeof(p_applicant) <> 'object' then
    raise exception 'p_applicant must be a JSON object';
  end if;

  select string_agg(format('%I', k), ', ')
  into v_cols
  from jsonb_object_keys(p_applicant) as k;

  if v_cols is null then
    raise exception 'p_applicant has no fields';
  end if;

  execute format(
    'insert into hrm_ranking_applicants (%s)
     select %s from jsonb_populate_record(null::hrm_ranking_applicants, $1)
     returning id',
    v_cols, v_cols
  )
  using p_applicant
  into v_id;

  insert into hrm_ranking_applicant_flow (applicant_id, user_id, receiver_id, status)
  values (v_id, p_user_id, p_receiver_id, p_flow_status);

  select to_jsonb(a) into v_row
  from hrm_ranking_applicants a
  where a.id = v_id;

  return v_row;
end;
$function$;
