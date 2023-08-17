import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { fullTextQuery } from '@/utils/text-helper'

const supabase = createClientComponentClient()

export async function fetchDistricts (filterKeyword: string, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_districts')
      .select('*,hrm_users:head_user_id(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Full text search
    if (filterKeyword !== '') {
      const searchQuery: string = fullTextQuery(filterKeyword)
      query = query.textSearch('name', searchQuery)
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

export async function fetchOffices (filterKeyword: string, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_offices')
      .select('*,hrm_users:head_user_id(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Full text search
    if (filterKeyword !== '') {
      const searchQuery: string = fullTextQuery(filterKeyword)
      query = query.textSearch('name', searchQuery)
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

export async function fetchPositions (filterKeyword: string, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_positions')
      .select('*', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Full text search
    if (filterKeyword !== '') {
      query = query.or(`name.ilike.%${filterKeyword}%`)
      // const searchQuery: string = fullTextQuery(filterKeyword)
      // query = query.textSearch('name', searchQuery)
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

export async function fetchSchools (filters: { filterKeyword?: string, filterType?: string, filterDistrictId?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_schools')
      .select('*,hrm_users:head_user_id(*),hrm_districts(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Full text search
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('name', searchQuery)
    }

    // filter type
    if (filters.filterType && filters.filterType !== '') {
      query = query.eq('type', filters.filterType)
    }

    // filter district
    if (filters.filterDistrictId && filters.filterDistrictId !== '') {
      query = query.eq('district_id', filters.filterDistrictId)
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

export async function fetchEmployees (filters: { filterKeyword?: string, filterSchool?: string, filterOffice?: string, filterSetupStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_users')
      .select('*, hrm_schools:school_id(*), hrm_positions:position_id(*), hrm_offices:office_id(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== '') {
      query = query.eq('school_id', filters.filterSchool)
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== '') {
      query = query.eq('office_id', filters.filterOffice)
    }

    // filter setup status
    if (filters.filterSetupStatus && filters.filterSetupStatus !== '') {
      if (filters.filterSetupStatus === 'Completed') {
        query = query.neq('assignment', '')
        query = query.not('position_id', 'is', null)
        query = query.neq('salary_grade', '')
        query = query.neq('salary_step', '')
      }
      if (filters.filterSetupStatus === 'Incomplete') {
        query = query.or('position_id.is.null,salary_grade.eq.\'\',salary_step.eq.\'\'')
      }
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
    console.error('fetch employee error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchRegistrations (filters: { filterKeyword?: string, filterSchool?: string, filterOffice?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_registrations')
      .select('*, hrm_schools(*), hrm_offices(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)
      .eq('status', 'For Approval')

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== '') {
      query = query.eq('school_id', filters.filterSchool)
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== '') {
      query = query.eq('office_id', filters.filterOffice)
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
    console.error('fetch employee error', error)
    return { data: [], count: 0 }
  }
}

export async function searchActiveEmployees (searchTerm: string, excludedItems: any[]) {
  let query = supabase
    .from('hrm_users')
    .select()
    .eq('status', 'Active')
    .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

  // Search match
  query = query.or(`firstname.ilike.%${searchTerm}%,middlename.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%`)

  // Excluded already selected items
  excludedItems.forEach(item => {
    query = query.neq('id', item.id)
  })

  // Limit results
  query = query.limit(3)

  const { data, error } = await query

  if (error) console.error(error)

  return data ?? []
}

export async function fetchAssignments (filterKeyword: string, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_assignments')
      .select('*,hrm_users:hrm_user_id(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Full text search
    if (filterKeyword !== '') {
      query = query.or(`hrm_users.firstname.ilike.%${filterKeyword}%,hrm_users.middlename.ilike.%${filterKeyword}%,hrm_users.lastname.ilike.%${filterKeyword}%`)
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
