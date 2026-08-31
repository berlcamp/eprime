'use client'

import { updateList as updateList2 } from '@/GlobalRedux/Features/list2Slice'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import type { QueryError, QueryResult } from '@/utils/query-result'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

export interface ListFetcher<T> {
  (perPageCount: number, rangeFrom: number): Promise<QueryResult<T[]>>
}

interface Options<T> {
  /** Runs the paginated query. Must return a QueryResult, never a bare array. */
  fetcher: ListFetcher<T>
  /** Re-runs the query from page 0 whenever one of these changes. Keep the length constant. */
  deps: unknown[]
  perPage: number
  /** Which Redux list slice backs this page. Pages that show two lists use both. */
  slice?: 'list' | 'list2'
  /** Skip fetching, e.g. while an id the query depends on is still unknown. */
  enabled?: boolean
}

interface ListQuery<T> {
  list: T[]
  loading: boolean
  /** Non-null only when the fetch itself failed. An empty list is not an error. */
  error: QueryError | null
  /** True only for a genuinely empty result — never for a failed one. */
  isEmpty: boolean
  hasMore: boolean
  /** Rows currently on screen — feeds the <PerPage> "showing X of Y" label. */
  showing: number
  /** Total rows matching the filters, from the query's exact count. */
  results: number
  refetch: () => void
  showMore: () => void
}

/**
 * The list-page data trio (fetch, show-more, refetch-on-filter-change) that was
 * copy-pasted across ~90 page.tsx files, with the two bugs those copies shared:
 *
 *  - a failed fetch fell through to an empty list and rendered "No records
 *    found", so users could not distinguish an outage from an empty table;
 *  - rapid filter changes raced, and whichever request happened to land last
 *    won, which is not necessarily the one matching the filters on screen.
 *
 * The list still lives in Redux so the existing Add/Edit/Delete modals keep
 * working unchanged — they dispatch `addItem`/`editList`/`deleteItem` and this
 * hook reads the result back out.
 */
export function useListQuery<T>({
  fetcher,
  deps,
  perPage,
  slice = 'list',
  enabled = true
}: Options<T>): ListQuery<T> {
  const dispatch = useDispatch()
  const store = useStore()
  // Starts true so the first paint shows the loading skeleton instead of
  // flashing "No records found." before the effect fires.
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<QueryError | null>(null)

  const list = useSelector((state: any) =>
    slice === 'list2' ? state.list2.value : state.list.value
  ) as T[]
  const resultsCounter = useSelector((state: any) => state.results.value)

  // Only the newest request may write state; older ones are discarded.
  const requestId = useRef(0)

  // Reads the committed list straight from the store, so appending is never
  // based on a stale closure and no ref is touched during render.
  const currentList = useCallback(
    (): T[] =>
      slice === 'list2'
        ? (store.getState() as any).list2.value
        : (store.getState() as any).list.value,
    [slice, store]
  )

  const setList = useCallback(
    (next: T[]) => {
      dispatch(slice === 'list2' ? updateList2(next) : updateList(next))
    },
    [dispatch, slice]
  )

  const run = useCallback(
    async (rangeFrom: number, mode: 'replace' | 'append') => {
      const id = ++requestId.current
      setLoading(true)

      const result = await fetcher(perPage, rangeFrom)

      // A newer request superseded this one while it was in flight.
      if (id !== requestId.current) return

      if (!result.ok) {
        setError(result.error)
        if (mode === 'replace') {
          setList([])
          dispatch(updateResultCounter({ showing: 0, results: 0 }))
        }
        setLoading(false)
        return
      }

      setError(null)
      const next =
        mode === 'append' ? [...currentList(), ...result.data] : result.data

      setList(next)
      dispatch(
        updateResultCounter({
          showing: next.length,
          results: result.count ?? next.length
        })
      )
      setLoading(false)
    },
    [currentList, dispatch, fetcher, perPage, setList]
  )

  const refetch = useCallback(() => {
    void run(0, 'replace')
  }, [run])

  const showMore = useCallback(() => {
    void run(currentList().length, 'append')
  }, [currentList, run])

  useEffect(() => {
    if (!enabled) return

    // Clear the previous page's rows so stale results never show under new
    // filters. Any existing error stays on screen until the new query settles,
    // rather than blanking and then reappearing.
    setList([])
    // Fetching on mount is the whole job of this effect, and `run` flips the
    // loading flag before it awaits so the skeleton appears immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run(0, 'replace')

    // `deps` is the caller's filter list; `run` is intentionally excluded so an
    // inline fetcher does not retrigger the query on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, perPage])

  return {
    list,
    loading,
    error,
    isEmpty: !loading && error === null && list.length === 0,
    hasMore: resultsCounter.results > resultsCounter.showing && !loading,
    showing: resultsCounter.showing,
    results: resultsCounter.results,
    refetch,
    showMore
  }
}
