import { createBrowserClient } from '@supabase/ssr'
import { fullTextQuery } from '@/utils/text-helper'
import { format } from 'date-fns'

// types
import type { AssignmentTypes, DesignationTypes, excludedItemsTypes, Employee, CtoTypes, FlowListTypes, FollowersTypes } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
      .select('*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_assignments(status,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name)), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))', { count: 'exact' })
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
        query = query.not('position_id', 'is', null)
        query = query.neq('salary_grade', '')
        query = query.neq('salary_step', '')
      }
      if (filters.filterSetupStatus === 'Incomplete') {
        query = query.or('salary_grade.eq.\'\',salary_step.eq.\'\',position_id.is.null')
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

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
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

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      query = query.eq('status', filters.filterStatus)
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

export async function searchActiveEmployees (searchTerm: string, excludedItems: excludedItemsTypes[]) {
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

export async function fetchCtos (filters: { filterKeyword?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_ctos')
      .select('*, hrm_cto_users(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
    }

    // filter stats
    if (filters.filterStatus && filters.filterStatus !== '') {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (filters.filterStatus === 'Active') {
        query = query.gt('expiration', today)
      } else {
        query = query.lte('expiration', today)
      }
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: ctoData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: CtoTypes[] = ctoData

    return { data, count }
  } catch (error) {
    console.error('fetch ctos error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchMyCtos (filters: { filterKeyword?: string, userId: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_cto_users')
      .select('*, hrm_ctos:cto_id(*)', { count: 'exact' })
      .eq('hrm_user_id', filters.userId)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
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
    console.error('fetch ctos error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchServiceRecords (userId: string, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_service_records')
      .select('*,hrm_user:created_by(id,firstname,middlename,lastname)', { count: 'exact' })
      .eq('user_id', userId)

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
    return { data: [], count: 0 }
  }
}

export async function fetchServiceCredits (filters: { filterKeyword?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_service_credits')
      .select('*, hrm_service_credit_users(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: ctoData, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    const data: CtoTypes[] = ctoData

    return { data, count }
  } catch (error) {
    console.error('fetch sc error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchMyServiceCredits (filters: { filterKeyword?: string, userId: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_service_credit_users')
      .select('*, hrm_service_credits:service_credit_id(*)', { count: 'exact' })
      .eq('hrm_user_id', filters.userId)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
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
    console.error('fetch sc users error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchMyLeaveRequests (filters: { filterKeyword?: string, filterStatus?: string }, perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('hrm_leave_requests')
      .select('*, requester:requester_id(*), recommending:recommending_id(id,firstname,middlename,lastname), hr:hr_id(id,firstname,middlename,lastname), approver:approver_id(id,firstname,middlename,lastname)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
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

export async function logError (transaction: string, table: string, data: string, error: string) {
  await supabase
    .from('error_logs')
    .insert({
      system: 'hrm',
      transaction,
      table,
      data,
      error
    })
}

export async function fetchErrorLogs (perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase
      .from('error_logs')
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

export interface DocumentFilterTypes {
  filterKeyword?: string
  filterStatus?: string
  filterType?: string
  filterRequester?: string
}

export async function fetchDocuments (filters: DocumentFilterTypes, filterUrl: string | null, userId: string, perPageCount: number, rangeFrom: number) {
  try {
    // Get Department ID within Tracker Flow
    const { data: trackerFlow } = await supabase
      .from('hrm_tracker_flow')
      .select()
      .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)

    const trackerIds: string[] = []
    trackerFlow?.forEach((item: FlowListTypes) => {
      trackerIds.push(item.tracker_id)
    })

    let query = supabase
      .from('hrm_request_trackers')
      .select('*, hrm_request_tracker_stickies(*), hrm_tracker_followers(*),creator:created_by(id,firstname,lastname,middlename,avatar_url),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url),hrm_remarks(*)', { count: 'exact' })
      .in('id', trackerIds)

    // Full text search
    if (typeof filters.filterKeyword !== 'undefined' && filters.filterKeyword.trim() !== '') {
      // query = query.or(`agency.ilike.%${filters.filterKeyword}%,particulars.ilike.%${filters.filterKeyword}%,name.ilike.%${filters.filterKeyword}%,routing_slip_no.ilike.%${filters.filterKeyword}%,amount.ilike.%${filters.filterKeyword}%`)
      query = query.eq('reference_code', filters.filterKeyword.trim())
      // fulltext search from trackersearch posgres function
      // query = query.textSearch('trackersearch', fullTextQuery(filters.filterKeyword))
    }

    // Filter type
    if (typeof filters.filterType !== 'undefined' && filters.filterType !== '') {
      query = query.eq('type', filters.filterType)
    }

    if (typeof filters.filterStatus !== 'undefined' && filters.filterStatus !== '') {
      query = query.eq('current_status', filters.filterStatus)
    }

    // Filter Requester
    if (typeof filters.filterRequester !== 'undefined' && filters.filterRequester !== '') {
      query = query.eq('created_by', filters.filterRequester)
    }

    if (filterUrl && filterUrl === 'following') {
      const docIds: string[] = []
      const { data }: { data: FollowersTypes[] | null } = await supabase
        .from('hrm_tracker_followers')
        .select()
        .eq('user_id', userId)

      if (data) {
        data.forEach(d => {
          docIds.push(d.tracker_id)
        })

        query = query.in('id', docIds)
      }
    }

    if (filterUrl && filterUrl === 'forwarded') {
      query = query.eq('receiver_id', userId)
      query = query.eq('current_tracker', 'Forwarded')
    }

    // Perform count before paginations
    // const { count } = await query

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)
    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, count, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { data, count }
  } catch (error) {
    console.error('fetch error xx', error)
    return { data: [], count: 0 }
  }
}
