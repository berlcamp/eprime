import type { DocumentTypes } from '@/types'
import { runQuery, type QueryResult } from '@/utils/query-result'
import { createBrowserClient } from '@/utils/supabase-browser'

const supabase = createBrowserClient()

export interface LeaveDateInput {
  date: string
  is_paid: boolean
}

/**
 * Creates a request together with its opening workflow rows, and — for leave —
 * its leave dates, in a single transaction.
 *
 * The six request forms each ran these as separate statements, so a failure
 * after the first left a request with no workflow (invisible to every
 * "forwarded to me" queue) while telling the user that saving had failed, which
 * generally produced a duplicate on the retry. See
 * supabase/migrations/0019_create_request_tracker.sql
 */
export async function createRequestTracker(
  requestType: string,
  tracker: Record<string, unknown>,
  userId: string,
  receiverId: string,
  leaveDates?: LeaveDateInput[]
): Promise<QueryResult<DocumentTypes | null>> {
  return await runQuery<DocumentTypes>(
    {
      transaction: `Create ${requestType} Request`,
      table: 'hrm_request_trackers',
      payload: tracker,
      userMessage: `Could not file this ${requestType.toLowerCase()} request. Nothing was saved, so it is safe to try again.`
    },
    supabase.rpc('create_request_tracker', {
      p_tracker: tracker,
      p_user_id: userId,
      p_receiver_id: receiverId,
      p_leave_dates: leaveDates ?? null
    })
  )
}
