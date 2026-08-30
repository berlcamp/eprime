-- Records when a ranking was moved to Closed.
--
-- hrm_rankings.status is overwritten in place and nothing logs rankings the
-- way hrm_tracker_logs logs tracker requests, so until now the closing date
-- was unrecoverable. app/(rsp)/ranking/AddEditModal.tsx now stamps this on the
-- Open -> Closed transition and clears it when a ranking is reopened.
--
-- Nullable on purpose: Open rankings have no closing date, and the backfill
-- below cannot reach every already-closed ranking.
ALTER TABLE hrm_rankings ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Backfill from the committee notifications that the same transition inserts
-- ("Ranking for ... is closing, as committee member you are required to
-- confirm."). Earliest notification per ranking is the closing date.
--
-- This is a best-effort reconstruction, not an audit trail. It misses:
--   - rankings closed with no Original Member committees (nothing was inserted)
--   - rankings closed before the notification code existed
--   - reopen/reclose cycles, where the earliest batch wins
-- Those rows keep closed_at NULL and the UI shows no date for them.
UPDATE hrm_rankings r
SET closed_at = n.closed_at
FROM (
  SELECT c.ranking_id, min(n.created_at) AS closed_at
  FROM hrm_notifications n
  JOIN hrm_ranking_committees c ON c.id = n.ranking_committee_id
  WHERE n.type = 'ranking'
    AND n.reference_table = 'hrm_ranking_committees'
    AND n.message LIKE '%is closing%'
  GROUP BY c.ranking_id
) n
WHERE r.id = n.ranking_id
  AND r.status = 'Closed'
  AND r.closed_at IS NULL;
