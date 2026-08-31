'use client'

import type { RankingTypes } from '@/types'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { runListQuery, type QueryError } from '@/utils/query-result'
import { createBrowserClient } from '@/utils/supabase-browser'
import { useEffect, useState } from 'react'

const supabase = createBrowserClient()

export interface RankingOptionsQuery {
  /** 'Open' or 'Closed'; omit for every ranking. */
  status?: string
  /** Embed each ranking's committees. Required by majorityConfirmedOnly. */
  withCommittees?: boolean
  /**
   * 'closed_at' puts the most recently closed first, with rankings that have
   * no recorded closing date (the backfill could not reach every one) falling
   * to the bottom by id. Defaults to id, newest first.
   */
  order?: 'id' | 'closed_at'
  /** Keep only rankings where a majority of committee members confirmed. */
  majorityConfirmedOnly?: boolean
  /** Keep only these ranking types. */
  types?: Set<string>
}

/**
 * The ranking dropdown behind eight RSP filter bars.
 *
 * Each of those built the same query inline and dropped its error, so a failed
 * fetch left the select empty under its own "No Closed Rankings Yet" label --
 * telling the user there were no rankings rather than that the lookup failed.
 * Callers render `error` instead of that label.
 *
 * Runs once on mount, like the eight copies it replaces; `query` is read on
 * that first run only, so an inline object literal is fine.
 */
export function useRankingOptions(query: RankingOptionsQuery = {}): {
  rankings: RankingTypes[]
  error: QueryError | null
} {
  const [rankings, setRankings] = useState<RankingTypes[]>([])
  const [error, setError] = useState<QueryError | null>(null)

  useEffect(() => {
    const fetchRankings = async () => {
      // Each branch passes a literal to select(): Supabase parses the string
      // at the type level and cannot read a computed one.
      const table = supabase.from('hrm_rankings')
      let request: PostgrestFilterBuilder<any, any, any, any, any> =
        query.withCommittees
          ? table.select(
              '*,position:position_id(name),committees:hrm_ranking_committees(*)'
            )
          : table.select('*,position:position_id(name)')

      if (query.status) {
        request = request.eq('status', query.status)
      }

      if (query.order === 'closed_at') {
        request = request.order('closed_at', {
          ascending: false,
          nullsFirst: false
        })
      }

      request = request.order('id', { ascending: false })

      const result = await runListQuery<RankingTypes>(
        {
          transaction: 'Fetch ranking options',
          table: 'hrm_rankings',
          payload: query.status ? { status: query.status } : undefined,
          userMessage: 'Could not load the list of rankings.'
        },
        request
      )

      if (!result.ok) {
        setError(result.error)
        return
      }

      setError(null)
      setRankings(
        result.data.filter((ranking) => {
          if (query.types && !query.types.has(ranking.type)) return false

          if (query.majorityConfirmedOnly) {
            const totalMembers = ranking.committees.length
            const confirmed = ranking.committees.filter(
              (c) => c.status === 'Confirmed'
            ).length

            return confirmed > totalMembers / 2 // Majority check
          }

          return true
        })
      )
    }

    void fetchRankings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { rankings, error }
}
