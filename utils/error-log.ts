import { createBrowserClient } from '@/utils/supabase-browser'

const supabase = createBrowserClient()

/**
 * Records a failed transaction in `error_logs`.
 *
 * Callers reach this on their failure path, so it never throws and never
 * rejects — a logger that failed here would replace a handled error with an
 * unhandled one. When the insert itself fails we fall back to the console with
 * the whole payload, so a broken error log is still visible instead of quietly
 * dropping every error the system records.
 */
export async function logError(
  transaction: string,
  table: string,
  data: string,
  error: string
) {
  try {
    const { error: insertError } = await supabase.from('error_logs').insert({
      system: 'hrm',
      transaction,
      table,
      data,
      error
    })

    if (insertError) {
      reportToConsole(transaction, table, data, error, insertError.message)
    }
  } catch (e) {
    reportToConsole(
      transaction,
      table,
      data,
      error,
      e instanceof Error ? e.message : String(e)
    )
  }
}

function reportToConsole(
  transaction: string,
  table: string,
  data: string,
  error: string,
  logFailure: string
) {
  console.error(
    `[error-log] could not write to error_logs (${logFailure}). Original error follows:`,
    { transaction, table, data, error }
  )
}
