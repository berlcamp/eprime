import { logError } from '@/utils/error-log'

/**
 * The result of a Supabase read or write.
 *
 * A failure carries no `data` field at all, so a caller that forgets to check
 * `ok` gets a type error rather than an empty array. That is the whole point:
 * the old `catch { return { data: [], count: 0 } }` pattern made a dropped
 * connection and an empty table look identical to the user.
 */
export type QueryResult<T> =
  | { ok: true, data: T, count: number | null }
  | { ok: false, error: QueryError }

export interface QueryError {
  /** Safe to show the user. */
  message: string
  /** PostgREST/Postgres detail, for the error log and the console. */
  cause: string
  /** PostgREST error code, when one was returned. */
  code?: string
}

/** What was being attempted. Used for the `error_logs` row and the console. */
export interface QueryContext {
  /** Human description, e.g. 'Fetch CTOs'. */
  transaction: string
  table: string
  /** Payload of a write, so a failed insert/update can be replayed from the log. */
  payload?: unknown
  /** Replaces the generic user-facing message with something page-specific. */
  userMessage?: string
}

/**
 * Structural shape of a Supabase query builder. Matching it structurally keeps
 * us off PostgREST's internal generic types, which change between releases.
 */
type PostgrestLike<T> = PromiseLike<{
  data: T | null
  error: {
    message: string
    code?: string
    details?: string | null
    hint?: string | null
  } | null
  count?: number | null
}>

/**
 * Awaits a Supabase query and converts both returned errors and thrown
 * exceptions into a `QueryResult`. Failures are written to `error_logs`.
 */
export async function runQuery<T>(
  context: QueryContext,
  query: PostgrestLike<T>
): Promise<QueryResult<T | null>> {
  try {
    const { data, error, count } = await query

    if (error) {
      return fail(context, error.message, error.code)
    }

    return { ok: true, data, count: count ?? null }
  } catch (e) {
    // Thrown rather than returned: network failure, aborted fetch, bad JSON.
    return fail(context, e instanceof Error ? e.message : String(e))
  }
}

/**
 * `runQuery` for list selects. On success `data` is always an array — Supabase
 * returns `null` for a query that matched nothing, and with no error that
 * genuinely means zero rows.
 */
export async function runListQuery<T>(
  context: QueryContext,
  query: PostgrestLike<T[]>
): Promise<QueryResult<T[]>> {
  const result = await runQuery<T[]>(context, query)

  if (!result.ok) return result

  return { ok: true, data: result.data ?? [], count: result.count }
}

function fail(
  context: QueryContext,
  cause: string,
  code?: string
): { ok: false, error: QueryError } {
  // Not awaited: if the database is unreachable, the log insert will hang too,
  // and the user should not wait on it to be told the page failed. `logError`
  // reports its own failures to the console.
  void logError(
    context.transaction,
    context.table,
    context.payload === undefined ? '' : safeStringify(context.payload),
    cause
  )

  console.error(`[${context.transaction}] ${context.table}: ${cause}`)

  return {
    ok: false,
    error: {
      message: context.userMessage ?? toUserMessage(cause, code),
      cause,
      code
    }
  }
}

/** Turns a PostgREST failure into something a DepEd HR user can act on. */
function toUserMessage(cause: string, code?: string): string {
  // Row-level security rejected the request.
  if (code === '42501' || cause.includes('row-level security')) {
    return 'You do not have permission to view this record. Please contact the system administrator.'
  }

  // Expired or missing JWT.
  if (code === 'PGRST301' || cause.includes('JWT')) {
    return 'Your session has expired. Please sign in again.'
  }

  // Unique constraint.
  if (code === '23505') {
    return 'That record already exists.'
  }

  // Foreign key constraint.
  if (code === '23503') {
    return 'This record is still linked to other records and cannot be saved or removed.'
  }

  // The app is asking for a function, table or column the database does not
  // have — a deploy whose migrations were never applied. Users retried these
  // for a full day reading only "please try again", so say what it really is.
  // PGRST202 = missing function, PGRST203 = ambiguous overload,
  // PGRST204/205 = missing column/table.
  if (
    code === 'PGRST202' ||
    code === 'PGRST203' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    cause.includes('in the schema cache')
  ) {
    return 'This part of the system is missing a database update on the server. Retrying will not help — please report this to the system administrator.'
  }

  // PostgREST is reloading its schema cache, e.g. just after a migration.
  if (cause.includes('schema cache. Retrying')) {
    return 'The server is finishing an update. Please wait a moment and try again.'
  }

  if (
    cause.includes('Failed to fetch') ||
    cause.includes('NetworkError') ||
    // Safari's wording for the same thing.
    cause.includes('Load failed')
  ) {
    return 'Could not reach the server. Please check your internet connection and try again.'
  }

  return 'Something went wrong while loading this data. Please try again.'
}

function safeStringify(payload: unknown): string {
  try {
    return JSON.stringify(payload)
  } catch {
    return String(payload)
  }
}
