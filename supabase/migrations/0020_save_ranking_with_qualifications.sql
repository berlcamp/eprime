-- Saving a ranking together with its qualification standards.
--
-- app/(rsp)/ranking/AddEditModal.tsx did this as a sequence of statements from
-- the browser:
--
--   create: insert the ranking, then fire one insert per qualification through
--     Promise.all with the results thrown away entirely -- no error was even
--     destructured. A ranking could come out missing some of the standards its
--     applicants would then be screened against, with nothing to show for it.
--
--   update: update the ranking, read the existing qualification ids, update the
--     kept ones one round trip at a time, insert the new ones, delete the
--     removed ones. Every failure threw into a catch that only reached the
--     console, leaving the ranking updated and its standards half-synced.
--
-- Both are one transaction here, and the per-row update loop is a single
-- set-based statement.
--
-- A qualification carrying an "id" is an existing row to update; one without is
-- new; any row of this ranking whose id is absent from the payload is removed.

CREATE OR REPLACE FUNCTION public.sync_ranking_qualifications(
  p_ranking_id bigint,
  p_qualifications jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $function$
begin
  if p_qualifications is null or jsonb_typeof(p_qualifications) <> 'array' then
    raise exception 'p_qualifications must be a JSON array';
  end if;

  -- Removed first, so a row cannot be deleted after being updated.
  delete from hrm_ranking_qualifications q
  where q.ranking_id = p_ranking_id
    and not exists (
      select 1
      from jsonb_array_elements(p_qualifications) as e
      where nullif(e ->> 'id', '')::bigint = q.id
    );

  update hrm_ranking_qualifications q
  set name        = x.name,
      description = x.description,
      required    = x.required
  from (
    select nullif(e ->> 'id', '')::bigint          as id,
           e ->> 'name'                            as name,
           e ->> 'description'                     as description,
           coalesce((e ->> 'required')::boolean, false) as required
    from jsonb_array_elements(p_qualifications) as e
    where nullif(e ->> 'id', '') is not null
  ) as x
  where q.id = x.id
    and q.ranking_id = p_ranking_id;

  insert into hrm_ranking_qualifications (ranking_id, name, description, required)
  select p_ranking_id,
         e ->> 'name',
         e ->> 'description',
         coalesce((e ->> 'required')::boolean, false)
  from jsonb_array_elements(p_qualifications) as e
  where nullif(e ->> 'id', '') is null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_ranking(
  p_ranking jsonb,
  p_qualifications jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_cols text;
  v_id   bigint;
  v_row  jsonb;
begin
  if p_ranking is null or jsonb_typeof(p_ranking) <> 'object' then
    raise exception 'p_ranking must be a JSON object';
  end if;

  select string_agg(format('%I', k), ', ')
  into v_cols
  from jsonb_object_keys(p_ranking) as k;

  if v_cols is null then
    raise exception 'p_ranking has no fields';
  end if;

  execute format(
    'insert into hrm_rankings (%s)
     select %s from jsonb_populate_record(null::hrm_rankings, $1)
     returning id',
    v_cols, v_cols
  )
  using p_ranking
  into v_id;

  perform sync_ranking_qualifications(v_id, p_qualifications);

  select to_jsonb(r) into v_row from hrm_rankings r where r.id = v_id;

  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_ranking(
  p_ranking_id bigint,
  p_ranking jsonb,
  p_qualifications jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_sets text;
  v_row  jsonb;
  v_hit  bigint;
begin
  if p_ranking is null or jsonb_typeof(p_ranking) <> 'object' then
    raise exception 'p_ranking must be a JSON object';
  end if;

  select string_agg(format('%1$I = r.%1$I', k), ', ')
  into v_sets
  from jsonb_object_keys(p_ranking) as k;

  if v_sets is null then
    raise exception 'p_ranking has no fields';
  end if;

  execute format(
    'update hrm_rankings t
     set %s
     from jsonb_populate_record(null::hrm_rankings, $1) as r
     where t.id = $2
     returning t.id',
    v_sets
  )
  using p_ranking, p_ranking_id
  into v_hit;

  if v_hit is null then
    raise exception 'Ranking % no longer exists', p_ranking_id;
  end if;

  perform sync_ranking_qualifications(p_ranking_id, p_qualifications);

  select to_jsonb(r) into v_row from hrm_rankings r where r.id = p_ranking_id;

  return v_row;
end;
$function$;
