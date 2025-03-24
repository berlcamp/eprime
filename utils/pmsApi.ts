/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createBrowserClient } from '@supabase/ssr'
import { fullTextQuery } from './text-helper'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchKras(
  filters: {
    filterKeyword?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('kra')
      .select('*', { count: 'exact' })
      .neq('is_archive', 'true')

    // Full text search
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('title', searchQuery)
    }

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

export async function fetchObjectives(
  filters: {
    filterKeyword?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase.from('kra_objectives').select(
      `*,
                kra (
                  id,title
                )
              `,
      { count: 'exact' }
    )

    // Full text search
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('title', searchQuery)
    }

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

export async function fetchIpcrfTemplates(
  filters: {
    filterKeyword?: string
    showArchive: boolean
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase.from('ipcrf_templates').select()

    // Full text search
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      const searchQuery = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('title', searchQuery)
    }

    // View Archive
    if (filters.showArchive) {
      query = query.eq('is_archive', true)
    } else {
      query = query.neq('is_archive', true)
    }

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

export async function fetchCompetencies(
  filters: {
    filterKeyword?: string
    filterType?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase.from('competencies').select(
      `*,
                competency_items (
                  id,title
                )
                ipcrf_template:ipcrf_templates (title),
              `,
      { count: 'exact' }
    )

    // Full text search
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('title', searchQuery)
    }

    if (filters.filterType && filters.filterType !== '') {
      query = query.eq('type', filters.filterType)
    }

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

export async function fetchIpcrfs(
  filters: {
    filterKeyword?: string
    view: string
    userId: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase.from('ipcrfs').select(
      `*,
                ipcrf_template:ipcrf_template_id (title),
                rater:rater_user_id(id,firstname,lastname,middlename)
              `,
      { count: 'exact' }
    )

    // View type
    if (filters.view === 'my_ipcrf') {
      query = query.eq('user_id', filters.userId)
    }
    if (filters.view === 'as_rater') {
      query = query.eq('rater_user_id', filters.userId)
    }

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

export async function fetchDevelopmentPlans(
  filters: {
    userId: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_development_plans')
      .select(
        `*,
                strength_objective:strength_objective_id (*),
                weak_objective:strength_objective_id (*),
                intervention:intervention_id (*)
              `,
        { count: 'exact' }
      )
      .eq('user_id', filters.userId)

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
