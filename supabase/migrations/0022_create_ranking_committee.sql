-- Adding a committee member together with the criteria they may score.
--
-- app/(rsp)/ranking/RankingCommittees.tsx inserted the committee row, then
-- inserted the hrm_ranking_committee_criterias rows with the result thrown
-- away entirely -- no error was destructured. A failure there produced a
-- committee member assigned no criteria, who therefore cannot cast points at
-- all; RankingApplicants hides the Cast Points button in exactly that case, so
-- it reads to the member as "you are not on this committee".
--
-- Both inserts are one transaction here.

CREATE OR REPLACE FUNCTION public.create_ranking_committee(
  p_committee jsonb,
  p_criteria_ids bigint[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_cols text;
  v_id   bigint;
  v_row  jsonb;
begin
  if p_committee is null or jsonb_typeof(p_committee) <> 'object' then
    raise exception 'p_committee must be a JSON object';
  end if;

  select string_agg(format('%I', k), ', ')
  into v_cols
  from jsonb_object_keys(p_committee) as k;

  if v_cols is null then
    raise exception 'p_committee has no fields';
  end if;

  execute format(
    'insert into hrm_ranking_committees (%s)
     select %s from jsonb_populate_record(null::hrm_ranking_committees, $1)
     returning id',
    v_cols, v_cols
  )
  using p_committee
  into v_id;

  if array_length(p_criteria_ids, 1) > 0 then
    insert into hrm_ranking_committee_criterias (committee_id, criteria_id)
    select v_id, unnest(p_criteria_ids);
  end if;

  select to_jsonb(c) into v_row
  from hrm_ranking_committees c
  where c.id = v_id;

  return v_row;
end;
$function$;
