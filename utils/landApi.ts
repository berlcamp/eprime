/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchInteventions(
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_interventions')
      .select('*', { count: 'exact' })

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }
    return { data, count }
  } catch (error) {
    console.error('fetch error', error)
    return { data: [], count: 0 }
  }
}
