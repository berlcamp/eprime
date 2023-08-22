import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { fullTextQuery } from '@/utils/text-helper'
import { format } from 'date-fns'

// types
import type { AssignmentTypes, DesignationTypes, Employee } from '@/types'

const supabase = createClientComponentClient()

export async function fetchDistricts (filterKeyword: string, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_districts')
      .select('*,hrm_users:head_user_id(firstname,middlename,lastname)', { count: 'exact' })
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
      .select('*,hrm_users:head_user_id(firstname,middlename,lastname)', { count: 'exact' })
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
      .select('*,hrm_users:head_user_id(firstname,middlename,lastname),hrm_districts(name)', { count: 'exact' })
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
      .select('*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('fts', searchQuery)
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

    const { data: userData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: Employee[] = userData

    return { data, count }
  } catch (error) {
    console.error('fetch employee error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchAssignments (filters: { filterKeyword?: string, filterSchool?: string, filterOffice?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_assignments')
      .select('*, hrm_users:hrm_user_id(firstname,middlename,lastname),hrm_schools:school_id(name),hrm_offices:office_id(name),hrm_positions:position_id(name)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // Search on hrm_users table first
      const users = await fetchEmployees({ filterKeyword: filters.filterKeyword }, 300, 0)

      const userIds: string[] = []
      users.data.forEach((item) => {
        userIds.push(item.id)
      })

      let userIdsOrStatement = ''
      if (userIds.length > 0) {
        userIdsOrStatement = `hrm_user_id.in.(${userIds.join(',')}),` // append this to main query below
      }

      query = query.or(`${userIdsOrStatement}reference_code.eq.${filters.filterKeyword}`)
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
    if (filters.filterStatus && filters.filterStatus !== '') {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (filters.filterStatus === 'Active') {
        // filter where date (to) is blank or less than the current date
        query = query.or(`to.gte.'${today}',to.is.null`)
        query = query.gte('from', `${today}`)
      }
      if (filters.filterStatus === 'Expired') {
        // filter where date (to) is green than the today's date
        query = query.lt('to', `${today}`)
        query = query.not('to', 'is', null)
      }
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: assignmentsData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: AssignmentTypes[] = assignmentsData

    return { data, count }
  } catch (error) {
    console.error('fetch assignments error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchDesignations (filters: { filterKeyword?: string, filterSchool?: string, filterOffice?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_designations')
      .select('*, hrm_users:hrm_user_id(firstname,middlename,lastname),hrm_schools:school_id(name),hrm_offices:office_id(name),hrm_positions:position_id(name)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // Search on hrm_users table first
      const users = await fetchEmployees({ filterKeyword: filters.filterKeyword }, 300, 0)

      const userIds: string[] = []
      users.data.forEach((item) => {
        userIds.push(item.id)
      })

      let userIdsOrStatement = ''
      if (userIds.length > 0) {
        userIdsOrStatement = `hrm_user_id.in.(${userIds.join(',')}),` // append this to main query below
      }

      query = query.or(`${userIdsOrStatement}reference_code.eq.${filters.filterKeyword}`)
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
    if (filters.filterStatus && filters.filterStatus !== '') {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (filters.filterStatus === 'Active') {
        // filter where date (to) is blank or less than the current date
        query = query.or(`to.gte.'${today}',to.is.null`)
        query = query.gte('from', `${today}`)
      }
      if (filters.filterStatus === 'Expired') {
        // filter where date (to) is green than the today's date
        query = query.lt('to', `${today}`)
        query = query.not('to', 'is', null)
      }
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: assignmentsData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: DesignationTypes[] = assignmentsData

    return { data, count }
  } catch (error) {
    console.error('fetch designations error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchRegistrations (filters: { filterKeyword?: string, filterSchool?: string, filterOffice?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_registrations')
      .select('*, hrm_schools(name), hrm_offices(name)', { count: 'exact' })
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

    const { data: userData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: Employee[] = userData

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
