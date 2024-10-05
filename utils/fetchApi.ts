import { fullTextQuery } from '@/utils/text-helper'
import { createBrowserClient } from '@supabase/ssr'
import { format } from 'date-fns'

// types
import type {
  AssignmentTypes,
  CtoTypes,
  DesignationTypes,
  Employee,
  excludedItemsTypes,
  FlowListTypes,
  FollowersTypes,
  ItemTypes
} from '@/types'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function fetchDistricts(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_districts')
      .select('*,hrm_users:head_user_id(firstname,middlename,lastname)', {
        count: 'exact'
      })
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

export async function fetchOffices(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_offices')
      .select('*,hrm_users:head_user_id(firstname,middlename,lastname)', {
        count: 'exact'
      })
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
    query = query.order('name', { ascending: true })

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

export async function fetchPositions(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number
) {
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
    query = query.order('name', { ascending: true })

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

export async function fetchSchools(
  filters: {
    filterKeyword?: string
    filterType?: string
    filterDistrictId?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_schools')
      .select(
        '*,hrm_users:head_user_id(id,firstname,middlename,lastname),hrm_districts(name)',
        { count: 'exact' }
      )
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
    query = query.order('name', { ascending: true })

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

export async function fetchEmployees(
  filters: {
    filterUser?: string
    filterKeyword?: string
    filterSchool?: string
    filterOffice?: string
    filterSetupStatus?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_users')
      .select(
        '*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_assignments(status,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name)), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))',
        { count: 'exact' }
      )
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('fts', searchQuery)
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== '') {
      query = query.eq('id', filters.filterUser)
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
        query = query.or(
          "salary_grade.eq.'',salary_step.eq.'',position_id.is.null"
        )
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

export async function fetchPersonnel(
  filters: { filterKeyword?: string },
  schoolIds: string[],
  officeIds: string[],
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_users')
      .select(
        '*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_assignments(status,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name)), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))',
        { count: 'exact' }
      )
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // if (schoolIds.length > 0) {
    //   query = query.in('school_id', schoolIds)
    // }

    // if (officeIds.length > 0) {
    //   query = query.in('office_id', officeIds)
    // }

    if (schoolIds.length > 0 && officeIds.length > 0) {
      let q1 = schoolIds.map((id) => `school_id.eq.${id}`).join(',')
      let q2 = officeIds.map((id) => `office_id.eq.${id}`).join(',')
      let combinedQuery = [q1, q2].filter(Boolean).join(',')
      query = query.or(combinedQuery)
    } else if (schoolIds.length > 0) {
      query = query.in('school_id', schoolIds)
    } else if (officeIds.length > 0) {
      query = query.in('office_id', officeIds)
    }

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
      const searchQuery: string = fullTextQuery(filters.filterKeyword)
      query = query.textSearch('fts', searchQuery)
    }

    // Per Page from context
    const from = rangeFrom
    const to = from + (perPageCount - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data: userData, error, count } = await query

    console.log('user data', userData)

    if (error) {
      throw new Error(error.message)
    }

    const data: Employee[] = userData

    return { data, count }
  } catch (error) {
    console.error('fetch personnel error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchAssignments(
  filters: {
    filterKeyword?: string
    filterSchool?: string
    filterOffice?: string
    filterStatus?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_assignments')
      .select(
        '*, hrm_users:hrm_user_id(firstname,middlename,lastname,avatar_url),hrm_schools:school_id(name),hrm_offices:office_id(name),hrm_positions:position_id(name)',
        { count: 'exact' }
      )
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // Search on hrm_users table first
      const users = await fetchEmployees(
        { filterKeyword: filters.filterKeyword },
        300,
        0
      )

      const userIds: string[] = []
      users.data.forEach((item) => {
        userIds.push(item.id)
      })

      let userIdsOrStatement = ''
      if (userIds.length > 0) {
        userIdsOrStatement = `hrm_user_id.in.(${userIds.join(',')}),` // append this to main query below
      }

      query = query.or(
        `${userIdsOrStatement}reference_code.eq.${filters.filterKeyword}`
      )
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

export async function fetchItems(
  filters: {
    filterKeyword?: string
    filterSchool?: string
    filterPosition?: string
    filterStatus?: string
    filterUser?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_items')
      .select(
        '*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),hrm_school:school_id(name),implementing_unit:implementing_unit_id(name),hrm_position:position_id(name)',
        { count: 'exact' }
      )
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Item Number
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('item_number', filters.filterKeyword)
    }

    // filter position
    if (filters.filterPosition && filters.filterPosition !== '') {
      query = query.eq('position_id', filters.filterPosition)
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== '') {
      if (filters.filterSchool === 'division') {
        query = query.is('implementing_unit_id', null)
      } else {
        query = query.eq('implementing_unit_id', filters.filterSchool)
      }
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== '') {
      if (filters.filterStatus === 'Vacant') {
        query = query.is('user_id', null)
      }
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== '') {
      query = query.eq('user_id', filters.filterUser)
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

    const data: ItemTypes[] = assignmentsData

    return { data, count }
  } catch (error) {
    console.error('fetch items error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchPromotions(
  filters: { filterPosition?: string; filterUser?: string },
  filterUrl: string | null,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_promotions')
      .select(
        '*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),hrm_item:item_id(item_number,hrm_position:position_id(name))',
        { count: 'exact' }
      )
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // filter position
    if (filters.filterPosition && filters.filterPosition !== '') {
      query = query.eq('position_id', filters.filterPosition)
    }

    // Filter by ID in url
    if (filterUrl) {
      query = query.eq('id', filterUrl)
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== '') {
      query = query.eq('user_id', filters.filterUser)
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

    const data: ItemTypes[] = assignmentsData

    return { data, count }
  } catch (error) {
    console.error('fetch promotions error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchMyPromotions(
  userId: string,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_promotions')
      .select(
        '*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),hrm_item:item_id(item_number,hrm_position:position_id(name))',
        { count: 'exact' }
      )
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
    console.error('fetch my promotions error', error)
    return { data: [], count: 0 }
  }
}

export async function fetchDesignations(
  filters: {
    filterKeyword?: string
    filterSchool?: string
    filterOffice?: string
    filterStatus?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_designations')
      .select(
        '*, hrm_users:hrm_user_id(firstname,middlename,lastname,avatar_url,position_type),hrm_schools:school_id(name),hrm_offices:office_id(name),hrm_positions:position_id(name)',
        { count: 'exact' }
      )
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      // Search on hrm_users table first
      const users = await fetchEmployees(
        { filterKeyword: filters.filterKeyword },
        300,
        0
      )

      const userIds: string[] = []
      users.data.forEach((item) => {
        userIds.push(item.id)
      })

      let userIdsOrStatement = ''
      if (userIds.length > 0) {
        userIdsOrStatement = `hrm_user_id.in.(${userIds.join(',')}),` // append this to main query below
      }

      query = query.or(
        `${userIdsOrStatement}reference_code.eq.${filters.filterKeyword}`
      )
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

export async function fetchRegistrations(
  filters: {
    filterKeyword?: string
    filterSchool?: string
    filterOffice?: string
  },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_registrations')
      .select('*, hrm_schools(name), hrm_offices(name)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)
      .eq('status', 'For Approval')

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.or(
        `firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`
      )
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

export async function searchActiveEmployees(
  searchTerm: string,
  excludedItems: excludedItemsTypes[]
) {
  let query = supabase
    .from('hrm_users')
    .select()
    .eq('status', 'Active')
    .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

  // Search match
  query = query.or(
    `firstname.ilike.%${searchTerm}%,middlename.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%`
  )

  // Excluded already selected items
  excludedItems.forEach((item) => {
    query = query.neq('id', item.id)
  })

  // Limit results
  query = query.limit(3)

  const { data, error } = await query

  if (error) console.error(error)

  return data ?? []
}

export async function fetchCtos(
  filters: { filterKeyword?: string; filterStatus?: string },
  filterUrl: string | null,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_ctos')
      .select('*, hrm_cto_users(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
    }

    // Filter by ID in url
    if (filterUrl) {
      query = query.eq('id', filterUrl)
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

export async function fetchMyCtos(
  filters: { filterKeyword?: string; userId: string },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_cto_users')
      .select(
        '*, hrm_ctos:cto_id(*), hrm_users:hrm_user_id(firstname,middlename,lastname)',
        { count: 'exact' }
      )
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

export async function fetchServiceRecords(
  userId: string,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_service_records')
      .select('*,hrm_user:created_by(id,firstname,middlename,lastname)', {
        count: 'exact'
      })
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

export async function fetchServiceCredits(
  filters: { filterKeyword?: string },
  filterUrl: string | null,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_service_credits')
      .select('*, hrm_service_credit_users(*)', { count: 'exact' })
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== '') {
      query = query.eq('reference_code', filters.filterKeyword)
    }

    // Filter by ID in url
    if (filterUrl) {
      query = query.eq('id', filterUrl)
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

export async function fetchMyServiceCredits(
  filters: { filterKeyword?: string; userId: string },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_service_credit_users')
      .select(
        '*, hrm_service_credits:service_credit_id(*), hrm_users:hrm_user_id(firstname,middlename,lastname)',
        { count: 'exact' }
      )
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

export async function fetchMyLeaveRequests(
  filters: { filterKeyword?: string; filterStatus?: string },
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_leave_requests')
      .select(
        '*, requester:requester_id(*), recommending:recommending_id(id,firstname,middlename,lastname), hr:hr_id(id,firstname,middlename,lastname), approver:approver_id(id,firstname,middlename,lastname)',
        { count: 'exact' }
      )
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

export async function logError(
  transaction: string,
  table: string,
  data: string,
  error: string
) {
  await supabase.from('error_logs').insert({
    system: 'hrm',
    transaction,
    table,
    data,
    error
  })
}

export async function fetchErrorLogs(perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase.from('error_logs').select('*', { count: 'exact' })

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

export async function fetchDocuments(
  filters: DocumentFilterTypes,
  filterUrl: string | null,
  userId: string,
  perPageCount: number,
  rangeFrom: number
) {
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
      .select(
        '*, hrm_request_tracker_stickies(*), hrm_tracker_followers(*),creator:created_by(id,firstname,lastname,middlename,avatar_url,position_type,hrm_positions:position_id(name)),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url),hrm_remarks(*)',
        { count: 'exact' }
      )
      .in('id', trackerIds)

    // Full text search
    if (
      typeof filters.filterKeyword !== 'undefined' &&
      filters.filterKeyword.trim() !== ''
    ) {
      // query = query.or(`agency.ilike.%${filters.filterKeyword}%,particulars.ilike.%${filters.filterKeyword}%,name.ilike.%${filters.filterKeyword}%,routing_slip_no.ilike.%${filters.filterKeyword}%,amount.ilike.%${filters.filterKeyword}%`)
      query = query.eq('reference_code', filters.filterKeyword.trim())
      // fulltext search from trackersearch posgres function
      // query = query.textSearch('trackersearch', fullTextQuery(filters.filterKeyword))
    }

    // Filter type
    if (
      typeof filters.filterType !== 'undefined' &&
      filters.filterType !== ''
    ) {
      query = query.eq('type', filters.filterType)
    }

    if (
      typeof filters.filterStatus !== 'undefined' &&
      filters.filterStatus !== ''
    ) {
      query = query.eq('current_status', filters.filterStatus)
    }

    // Filter Requester
    if (
      typeof filters.filterRequester !== 'undefined' &&
      filters.filterRequester !== ''
    ) {
      query = query.eq('created_by', filters.filterRequester)
    }

    // Following
    if (filterUrl && filterUrl === 'following') {
      const docIds: string[] = []
      const { data }: { data: FollowersTypes[] | null } = await supabase
        .from('hrm_tracker_followers')
        .select()
        .eq('user_id', userId)

      if (data) {
        data.forEach((d) => {
          docIds.push(d.tracker_id)
        })

        query = query.in('id', docIds)
      }
    }

    // Forwarded to me
    if (filterUrl && filterUrl === 'forwarded') {
      query = query.eq('receiver_id', userId)
      query = query.eq('current_tracker', 'Forwarded')
      query = query.neq('current_status', 'Cancelled')
      query = query.neq('current_status', 'Disapproved')
      query = query.neq('current_status', 'Approved')
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

export async function fetchLeaveCards(
  userId: string,
  type: string,
  perPageCount: number,
  rangeFrom: number
) {
  try {
    let query = supabase
      .from('hrm_leave_cards')
      .select(
        '*, hrm_user:user_id(id,firstname,lastname,middlename,avatar_url)',
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('id', { ascending: false })

    if (type !== '') {
      query = query.eq('type', type)
    }

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

export async function handleConvertEmployeeToNonTeaching(userId: string) {
  // convert employee to non-teaching
  const { error } = await supabase
    .from('hrm_users')
    .update({ position_type: 'Non-teaching' })
    .eq('id', userId)

  if (error) {
    void logError(
      'Update employee to non-teaching',
      'hrm_users',
      '',
      error.message
    )
  }

  // Count Service Credits balance if teaching
  const result = await fetchLeaveCards(userId, 'Service Credit', 10, 0)
  if (result.count && result.count > 0) {
    // first index of array should be the latest and updated balance
    const scBalance = result.data[0].balance

    // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
    const vlsl = (30 * Number(scBalance)) / 69

    // insert the result into leave cards table
    const newData = [
      {
        type: 'Sick Leave',
        balance: (vlsl / 2).toFixed(3),
        user_id: userId,
        remarks: 'Converted Service Credit to VL/SL',
        particulars: 'Sick Leave Adjustment'
      },
      {
        type: 'Vacation Leave',
        balance: (vlsl / 2).toFixed(3),
        user_id: userId,
        particulars: 'Vacation Leave Adjustment',
        remarks: 'Converted Service Credit to VL/SL'
      }
    ]

    const { error } = await supabase.from('hrm_leave_cards').insert(newData)

    if (error) {
      void logError(
        'Create Leave Card Adjustment from convertion formula',
        'hrm_leave_cards',
        JSON.stringify(newData),
        error.message
      )
      throw new Error(error.message)
    }
  }
}

export async function handleConvertEmployeeToTeaching(userId: string) {
  // convert employee to non-teaching
  const { error } = await supabase
    .from('hrm_users')
    .update({ position_type: 'Teaching' })
    .eq('id', userId)

  if (error) {
    void logError('Update employee to Teaching', 'hrm_users', '', error.message)
  }

  // Count VL and SL balance if non-teaching
  const result = await fetchLeaveCards(userId, '', 500, 0)
  if (result.count && result.count > 0) {
    const slList = result.data.filter((item) => item.type === 'Sick Leave')
    const vlList = result.data.filter((item) => item.type === 'Vacation Leave')

    // first index of array should be the latest and updated balance
    const sl = slList.length > 0 ? slList[0].balance : 0
    const vl = vlList.length > 0 ? vlList[0].balance : 0

    // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
    const sc = ((Number(sl) + Number(vl)) / 30) * 69

    // insert the result into leave cards table
    const newData = {
      type: 'Service Credit',
      balance: sc.toFixed(3),
      user_id: userId,
      remarks: 'Converted SL/VL to Service Credit',
      particulars: 'Service Credit Adjustment'
    }

    const { error } = await supabase.from('hrm_leave_cards').insert(newData)

    if (error) {
      void logError(
        'Create Leave Card Adjustment from convertion formula',
        'hrm_leave_cards',
        JSON.stringify(newData),
        error.message
      )
      throw new Error(error.message)
    }
  }
}
