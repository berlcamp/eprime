import { logError } from '@/utils/fetchApi'

/**
 * Browsers report a request that never got a response as a plain TypeError:
 * "Failed to fetch" (Chrome), "Load failed" (Safari), "NetworkError when
 * attempting to fetch resource." (Firefox). postgrest-js catches it and hands
 * it back as `error.message`, so this is what we match on.
 */
const networkErrorPattern =
  /failed to fetch|load failed|networkerror|network request failed|fetch failed|network error/i

export const isNetworkError = (message: string) =>
  networkErrorPattern.test(message)

const wait = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms))

const RETRIES = 3

/**
 * Saves a PDS payload, retrying requests that never reached the server.
 *
 * Every PDS save failure in the error log is a network-level TypeError rather
 * than a database rejection — the browser dropped the POST, usually on a
 * connection that went stale while the user spent minutes filling the tab.
 * Browsers auto-retry GETs but never a POST, so a single blip used to cost the
 * user everything they had typed.
 *
 * A failed save leaves the caller's state untouched, so the user can simply
 * click Save again — the message must never tell them to reload the page.
 */
export async function savePds(
  supabase: any,
  transaction: string,
  newData: Record<string, any>
): Promise<{ ok: boolean; message: string }> {
  let lastMessage = ''

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (!error) return { ok: true, message: 'Successfully saved.' }

    lastMessage = error.message ?? 'Unknown error'

    // A rejection from the database will fail again just as fast — only a
    // request that never landed is worth repeating.
    if (!isNetworkError(lastMessage)) break

    if (attempt < RETRIES) await wait(attempt * 600)
  }

  void logError(transaction, 'hrm_pds', JSON.stringify(newData), lastMessage)

  return {
    ok: false,
    message: isNetworkError(lastMessage)
      ? "Couldn't reach the server. Your entries are still here — check your connection and click Save again."
      : 'Saving failed. Your entries are still here — please try again.'
  }
}
