import { fullTextQuery } from "@/utils/text-helper";
import { createBrowserClient } from "@supabase/ssr";
import { format } from "date-fns";

// types
import type {
  AssignmentTypes,
  CtoTypes,
  DesignationTypes,
  Employee,
  excludedItemsTypes,
  FollowersTypes,
  ItemTypes,
  LeaveCreditTypes,
} from "@/types";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function fetchDistricts(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_districts")
      .select("*,hrm_users:head_user_id(firstname,middlename,lastname)", {
        count: "exact",
      })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Full text search
    if (filterKeyword !== "") {
      const searchQuery: string = fullTextQuery(filterKeyword);
      query = query.textSearch("name", searchQuery);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchOffices(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_offices")
      .select("*,hrm_users:head_user_id(firstname,middlename,lastname)", {
        count: "exact",
      })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Full text search
    if (filterKeyword !== "") {
      const searchQuery: string = fullTextQuery(filterKeyword);
      query = query.textSearch("name", searchQuery);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("name", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchPositions(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_positions")
      .select("*,qualifications:hrm_position_qualifications(*)", {
        count: "exact",
      })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Full text search
    if (filterKeyword !== "") {
      query = query.or(`name.ilike.%${filterKeyword}%`);
      // const searchQuery: string = fullTextQuery(filterKeyword)
      // query = query.textSearch('name', searchQuery)
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("name", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchImplementingUnits(
  filterKeyword: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_implementing_units")
      .select("*", { count: "exact" })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Full text search
    if (filterKeyword !== "") {
      query = query.or(`name.ilike.%${filterKeyword}%`);
      // const searchQuery: string = fullTextQuery(filterKeyword)
      // query = query.textSearch('name', searchQuery)
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("name", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchSchools(
  filters: {
    filterKeyword?: string;
    filterType?: string;
    filterDistrictId?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_schools")
      .select(
        "*,hrm_users:head_user_id(id,firstname,middlename,lastname),hrm_districts(name)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Full text search
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      const searchQuery: string = fullTextQuery(filters.filterKeyword);
      query = query.textSearch("name", searchQuery);
    }

    // filter type
    if (filters.filterType && filters.filterType !== "") {
      query = query.eq("type", filters.filterType);
    }

    // filter district
    if (filters.filterDistrictId && filters.filterDistrictId !== "") {
      query = query.eq("district_id", filters.filterDistrictId);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("name", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchEmployees(
  filters: {
    filterUser?: string;
    filterKeyword?: string;
    filterSchool?: string;
    filterOffice?: string;
    filterSetupStatus?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_users")
      .select(
        "*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_assignments(status,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name)), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      // query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
      const searchQuery: string = fullTextQuery(filters.filterKeyword);
      query = query.textSearch("fts", searchQuery);
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== "") {
      query = query.eq("id", filters.filterUser);
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== "") {
      query = query.eq("school_id", filters.filterSchool);
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== "") {
      query = query.eq("office_id", filters.filterOffice);
    }

    // filter setup status
    if (filters.filterSetupStatus && filters.filterSetupStatus !== "") {
      if (filters.filterSetupStatus === "No current position") {
        query = query.is("position_id", null);
      }
      if (filters.filterSetupStatus === "No current salary grade") {
        query = query.eq("salary_grade", "");
      }
      if (filters.filterSetupStatus === "No date of next increment") {
        query = query.neq("salary_step", "8");
        query = query.is("date_of_next_step_increment", null);
      }
      if (filters.filterSetupStatus === "No Plantilla") {
        query = query.is("item_id", null);
      }
    }

    if (filters.filterSetupStatus === "No Preset Record on Service Records") {
      const from = 0;
      const to = 9999;
      // Per Page from context
      query = query.range(from, to);
    } else {
      // Per Page from context
      const from = rangeFrom;
      const to = from + (perPageCount - 1);
      // Per Page from context
      query = query.range(from, to);
    }

    // Order By
    query = query.order("id", { ascending: false });

    const { data: userData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: Employee[] = userData;

    return { data, count };
  } catch (error) {
    console.error("fetch employee error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchPersonnel(
  filters: { filterKeyword?: string },
  schoolIds: string[],
  officeIds: string[],
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_users")
      .select(
        "*, grade_levels:hrm_personnel_grade_levels(*), coordinatorships:hrm_personnel_coordinatorships(*),majors:hrm_personnel_majors(*), subjects:hrm_personnel_subjects(*), hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_assignments(status,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name)), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))",
        { count: "exact" },
      );

    // if (schoolIds.length > 0) {
    //   query = query.in('school_id', schoolIds)
    // }

    // if (officeIds.length > 0) {
    //   query = query.in('office_id', officeIds)
    // }

    if (schoolIds.length > 0 && officeIds.length > 0) {
      const q1 = schoolIds.map((id) => `school_id.eq.${id}`).join(",");
      const q2 = officeIds.map((id) => `office_id.eq.${id}`).join(",");
      const combinedQuery = [q1, q2].filter(Boolean).join(",");
      query = query.or(combinedQuery);
    } else if (schoolIds.length > 0) {
      query = query.in("school_id", schoolIds);
    } else if (officeIds.length > 0) {
      query = query.in("office_id", officeIds);
    }

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      // query = query.or(`firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`)
      const searchQuery: string = fullTextQuery(filters.filterKeyword);
      query = query.textSearch("fts", searchQuery);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: userData, error, count } = await query;

    console.log("user data", userData);

    if (error) {
      throw new Error(error.message);
    }

    const data: Employee[] = userData;

    return { data, count };
  } catch (error) {
    console.error("fetch personnel error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchAssignments(
  filters: {
    filterKeyword?: string;
    filterSchool?: string;
    filterOffice?: string;
    filterStatus?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_assignments")
      .select(
        "*, hrm_users:hrm_user_id(firstname,middlename,lastname,avatar_url),hrm_schools:school_id(name),hrm_offices:office_id(name),hrm_positions:position_id(name)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      // Search on hrm_users table first
      const users = await fetchEmployees(
        { filterKeyword: filters.filterKeyword },
        300,
        0,
      );

      const userIds: string[] = [];
      users.data.forEach((item) => {
        userIds.push(item.id);
      });

      let userIdsOrStatement = "";
      if (userIds.length > 0) {
        userIdsOrStatement = `hrm_user_id.in.(${userIds.join(",")}),`; // append this to main query below
      }

      query = query.or(
        `${userIdsOrStatement}reference_code.eq.${filters.filterKeyword}`,
      );
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== "") {
      query = query.eq("school_id", filters.filterSchool);
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== "") {
      query = query.eq("office_id", filters.filterOffice);
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== "") {
      query = query.eq("status", filters.filterStatus);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: assignmentsData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: AssignmentTypes[] = assignmentsData;

    return { data, count };
  } catch (error) {
    console.error("fetch assignments error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchItems(
  filters: {
    filterKeyword?: string;
    filterNumber?: string;
    filterSchool?: string;
    filterPosition?: string;
    filterStatus?: string;
    filterUser?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_items")
      .select(
        "*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),hrm_school:school_id(name),implementing_unit:implementing_unit_id(name),hrm_position:position_id(name)",
        { count: "exact" },
      );

    // Item Number
    if (filters.filterNumber && filters.filterNumber !== "") {
      query = query.eq("item_number", filters.filterNumber);
    }

    // filter position
    if (filters.filterPosition && filters.filterPosition !== "") {
      query = query.eq("position_id", filters.filterPosition);
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== "") {
      if (filters.filterSchool === "division") {
        query = query.is("implementing_unit_id", null);
      } else {
        query = query.eq("implementing_unit_id", filters.filterSchool);
      }
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== "") {
      if (filters.filterStatus === "Vacant") {
        query = query.is("user_id", null);
      }
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== "") {
      query = query.eq("user_id", filters.filterUser);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("user_id", { ascending: false });

    const { data: assignmentsData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: ItemTypes[] = assignmentsData;

    return { data, count };
  } catch (error) {
    console.error("fetch items error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchAnnoucements(
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_announcements")
      .select("*", { count: "exact" });

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data, count };
  } catch (error) {
    console.error("fetch announcements error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchSubjects(perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase.from("hrm_subjects").select("*", { count: "exact" });

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data, count };
  } catch (error) {
    console.error("fetch subjects error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchCoordinatorships(
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_coordinatorships")
      .select("*", { count: "exact" });

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data, count };
  } catch (error) {
    console.error("fetch coordinatorships error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchRankings(
  filters: {
    userId?: string;
    filterPosition?: string;
    filterStatus?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    // If not RSP Manager
    const rankingIds: string[] = [];

    if (filters.userId) {
      const { data: data1 } = await supabase
        .from("hrm_rankings")
        .select("id")
        .eq("chairman_id", filters.userId)
        .limit(500);
      if (data1 && data1.length > 0) {
        data1.forEach((d: any) => rankingIds.push(d.id));
      }
      const { data: data2 } = await supabase
        .from("hrm_ranking_committees")
        .select("ranking_id")
        .eq("user_id", filters.userId)
        .limit(500);
      if (data2 && data2.length > 0) {
        data2.forEach((d: any) => rankingIds.push(d.ranking_id));
      }
      const { data: data3 } = await supabase
        .from("hrm_ranking_evaluators")
        .select("ranking_id")
        .eq("user_id", filters.userId)
        .limit(500);
      if (data3 && data3.length > 0) {
        data3.forEach((d: any) => rankingIds.push(d.ranking_id));
      }
      if (rankingIds.length === 0) {
        rankingIds.push("99999");
      }
    }

    let query = supabase
      .from("hrm_rankings")
      .select(
        "*, chairman:chairman_id(id,firstname,middlename,lastname,avatar_url),position:position_id(name), applicants:hrm_ranking_applicants(*), qualifications:hrm_ranking_qualifications(*),committees:hrm_ranking_committees(*)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // filter position
    if (filters.filterPosition && filters.filterPosition !== "") {
      query = query.eq("position_id", filters.filterPosition);
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== "") {
      query = query.eq("status", filters.filterStatus);
    }

    // If not RSP Manager
    if (rankingIds.length > 0) {
      query = query.in("id", rankingIds);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch ranking error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchRankingApplicants(
  filters: {
    filterKeyword?: string;
    filterCode?: string;
    filterRanking?: string;
    filterSchool?: string;
    filterOffice?: string;
    filterStatus?: string;
    filterType?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_ranking_applicants")
      .select(
        "*, employee:user_id(*),ranking:ranking_id(*,position:position_id(*)),approver:current_approver_id(*)",
        {
          count: "exact",
        },
      );

    // filter ranking
    if (filters.filterRanking && filters.filterRanking !== "") {
      query = query.eq("ranking_id", filters.filterRanking);
    }

    // filter keyword
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.or(
        `code.eq.${filters.filterKeyword},lastname.ilike.%${filters.filterKeyword}%,firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%`,
      );
    }

    // filter code
    if (filters.filterCode && filters.filterCode !== "") {
      query = query.eq("code", filters.filterCode);
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== "") {
      query = query.eq("school_id", filters.filterSchool);
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== "") {
      query = query.eq("office_id", filters.filterOffice);
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== "") {
      query = query.eq("status", filters.filterStatus);
    }

    // filter type
    if (filters.filterType && filters.filterType !== "") {
      query = query.eq("type", filters.filterType);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch ranking applicants error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchReclassifications(
  filters: {
    filterPosition?: string;
    filterStatus?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_reclassifications")
      .select(
        "*, chairman:chairman_id(id,firstname,middlename,lastname,avatar_url),position:position_id(name), applicants:hrm_reclassification_applicants(*)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // filter position
    if (filters.filterPosition && filters.filterPosition !== "") {
      query = query.eq("position_id", filters.filterPosition);
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== "") {
      query = query.eq("status", filters.filterStatus);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch reclassifications error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchReclassificationApplicants(
  filters: {
    filterUser?: string;
    filterRanking?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_reclassification_applicants")
      .select(
        "*, employee:user_id(id,lastname,firstname,middlename,avatar_url),reclassification:reclassification_id(*,position:position_id(*))",
        {
          count: "exact",
        },
      );

    // filter ranking
    if (filters.filterRanking && filters.filterRanking !== "") {
      query = query.eq("reclassification_id", filters.filterRanking);
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== "") {
      query = query.eq("user_id", filters.filterUser);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch ranking applicants error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchNosi(
  filters: {
    filterUser?: string;
    filterDate?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_nosi")
      .select(
        "*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url,hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name),hrm_item:item_id(item_number))",
        { count: "exact" },
      );

    // filter user
    if (filters.filterUser && filters.filterUser !== "") {
      query = query.eq("user_id", filters.filterUser);
    }
    // Filter Date
    if (filters.filterDate && filters.filterDate !== "") {
      query = query.eq("date", filters.filterDate);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data, count };
  } catch (error) {
    console.error("fetch nosi error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchUsersByLastnameLetter(
  lastnameLetter: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    const letter = lastnameLetter.trim().toUpperCase().charAt(0);
    if (!letter || !/^[A-Z]$/.test(letter)) {
      return { data: [], count: 0 };
    }

    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    const { data, error, count } = await supabase
      .from("hrm_users")
      .select(
        "*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_item:item_id(item_number)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID)
      .ilike("lastname", `${letter}%`)
      .range(from, to)
      .order("lastname", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return { data: data ?? [], count: count ?? 0 };
  } catch (error) {
    console.error("fetch users by lastname letter error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchRankingExpenses(
  filters: {
    filterRanking?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_ranking_expenses_summary")
      .select("*, ranking:ranking_id(*, position:position_id(name))", {
        count: "exact",
      });

    // filter ranking
    if (filters.filterRanking && filters.filterRanking !== "") {
      query = query.eq("ranking_id", filters.filterRanking);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data, count };
  } catch (error) {
    console.error("fetch ranking expenses error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchNosa(
  filters: {
    filterUser?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_nosa")
      .select(
        "*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url,hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name),hrm_item:item_id(item_number))",
        { count: "exact" },
      );

    // filter user
    if (filters.filterUser && filters.filterUser !== "") {
      query = query.eq("user_id", filters.filterUser);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return { data, count };
  } catch (error) {
    console.error("fetch nosa error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchSalaryGrades(
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_salaries")
      .select("*", { count: "exact" })
      .eq("is_active", "yes");

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);
    query = query.range(from, to).order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch salaries error", error);
    return { data: [], count: 0 };
  }
}

/** Fetches all salary rows (all tranches) for NOSA/NOSI features that need previous tranche resolution (e.g. Bulk NOSA). */
export async function fetchSalaryGradesForNosa(limit = 9999) {
  try {
    const { data, error } = await supabase
      .from("hrm_salaries")
      .select("*")
      .order("id", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return { data: data ?? [], count: data?.length ?? 0 };
  } catch (error) {
    console.error("fetch salary grades for nosa error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchPromotions(
  filters: { filterPosition?: string; filterUser?: string },
  filterUrl: string | null,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_promotions")
      .select(
        "*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url,gender,assignment),hrm_item:item_id(item_number,vice,salary_grade,hrm_position:position_id(name,salary_grade))",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // filter position
    if (filters.filterPosition && filters.filterPosition !== "") {
      query = query.eq("position_id", filters.filterPosition);
    }

    // Filter by ID in url
    if (filterUrl) {
      query = query.eq("id", filterUrl);
    }

    // filter user
    if (filters.filterUser && filters.filterUser !== "") {
      query = query.eq("user_id", filters.filterUser);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: assignmentsData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: ItemTypes[] = assignmentsData;

    return { data, count };
  } catch (error) {
    console.error("fetch promotions error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchMyPromotions(
  userId: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_promotions")
      .select(
        "*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),hrm_item:item_id(item_number,hrm_position:position_id(name))",
        { count: "exact" },
      )
      .eq("user_id", userId);

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch my promotions error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchDesignations(
  filters: {
    filterKeyword?: string;
    filterSchool?: string;
    filterOffice?: string;
    filterStatus?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_designations")
      .select(
        "*, hrm_users:hrm_user_id(firstname,middlename,lastname,avatar_url,position_type),hrm_schools:school_id(name),hrm_offices:office_id(name),hrm_positions:position_id(name)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      // Search on hrm_users table first
      const users = await fetchEmployees(
        { filterKeyword: filters.filterKeyword },
        300,
        0,
      );

      const userIds: string[] = [];
      users.data.forEach((item) => {
        userIds.push(item.id);
      });

      let userIdsOrStatement = "";
      if (userIds.length > 0) {
        userIdsOrStatement = `hrm_user_id.in.(${userIds.join(",")}),`; // append this to main query below
      }

      query = query.or(
        `${userIdsOrStatement}reference_code.eq.${filters.filterKeyword}`,
      );
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== "") {
      query = query.eq("school_id", filters.filterSchool);
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== "") {
      query = query.eq("office_id", filters.filterOffice);
    }

    // filter status
    if (filters.filterStatus && filters.filterStatus !== "") {
      query = query.eq("status", filters.filterStatus);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: assignmentsData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: DesignationTypes[] = assignmentsData;

    return { data, count };
  } catch (error) {
    console.error("fetch designations error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchRegistrations(
  filters: {
    filterKeyword?: string;
    filterSchool?: string;
    filterOffice?: string;
  },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_registrations")
      .select("*, hrm_schools(name), hrm_offices(name)", { count: "exact" })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID)
      .eq("status", "For Approval");

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.or(
        `firstname.ilike.%${filters.filterKeyword}%,middlename.ilike.%${filters.filterKeyword}%,lastname.ilike.%${filters.filterKeyword}%`,
      );
    }

    // filter school
    if (filters.filterSchool && filters.filterSchool !== "") {
      query = query.eq("school_id", filters.filterSchool);
    }

    // filter office
    if (filters.filterOffice && filters.filterOffice !== "") {
      query = query.eq("office_id", filters.filterOffice);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: userData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: Employee[] = userData;

    return { data, count };
  } catch (error) {
    console.error("fetch employee error", error);
    return { data: [], count: 0 };
  }
}

export async function searchActiveEmployees(
  searchTerm: string,
  excludedItems: excludedItemsTypes[],
) {
  let query = supabase
    .from("hrm_users")
    .select()
    .eq("status", "Active")
    .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

  // Search match
  query = query.or(
    `firstname.ilike.%${searchTerm}%,middlename.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%`,
  );

  // Excluded already selected items
  excludedItems.forEach((item) => {
    query = query.neq("id", item.id);
  });

  // Limit results
  query = query.limit(3);

  const { data, error } = await query;

  if (error) console.error(error);

  return data ?? [];
}

export async function fetchCtos(
  filters: { filterKeyword?: string; filterStatus?: string },
  filterUrl: string | null,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_ctos")
      .select("*, hrm_cto_users(*)", { count: "exact" })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.eq("reference_code", filters.filterKeyword);
    }

    // Filter by ID in url
    if (filterUrl) {
      query = query.eq("id", filterUrl);
    }

    // filter stats
    if (filters.filterStatus && filters.filterStatus !== "") {
      const today = format(new Date(), "yyyy-MM-dd");
      if (filters.filterStatus === "Active") {
        query = query.gt("expiration", today);
      } else {
        query = query.lte("expiration", today);
      }
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: ctoData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: CtoTypes[] = ctoData;

    return { data, count };
  } catch (error) {
    console.error("fetch ctos error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchMyCtos(
  filters: { filterKeyword?: string; userId: string },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_cto_users")
      .select(
        "*, hrm_ctos:cto_id(*), hrm_users:hrm_user_id(firstname,middlename,lastname)",
        { count: "exact" },
      )
      .eq("hrm_user_id", filters.userId);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.eq("reference_code", filters.filterKeyword);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch ctos error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchServiceRecords(
  userId: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_service_records")
      .select("*,hrm_user:created_by(id,firstname,middlename,lastname)", {
        count: "exact",
      })
      .eq("user_id", userId);

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    return { data: [], count: 0 };
  }
}

export async function fetchServiceCredits(
  filters: { filterKeyword?: string },
  filterUrl: string | null,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_service_credits")
      .select("*, hrm_service_credit_users(*)", { count: "exact" })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.eq("reference_code", filters.filterKeyword);
    }

    // Filter by ID in url
    if (filterUrl) {
      query = query.eq("id", filterUrl);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data: ctoData, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const data: CtoTypes[] = ctoData;

    return { data, count };
  } catch (error) {
    console.error("fetch sc error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchMyServiceCredits(
  filters: { filterKeyword?: string; userId: string },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_service_credit_users")
      .select(
        "*, hrm_service_credits:service_credit_id(*), hrm_users:hrm_user_id(firstname,middlename,lastname)",
        { count: "exact" },
      )
      .eq("hrm_user_id", filters.userId);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.eq("reference_code", filters.filterKeyword);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch sc users error", error);
    return { data: [], count: 0 };
  }
}

export async function fetchMyLeaveRequests(
  filters: { filterKeyword?: string; filterStatus?: string },
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_leave_requests")
      .select(
        "*, requester:requester_id(*), recommending:recommending_id(id,firstname,middlename,lastname), hr:hr_id(id,firstname,middlename,lastname), approver:approver_id(id,firstname,middlename,lastname)",
        { count: "exact" },
      )
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

    // Search match
    if (filters.filterKeyword && filters.filterKeyword !== "") {
      query = query.eq("reference_code", filters.filterKeyword);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export async function logError(
  transaction: string,
  table: string,
  data: string,
  error: string,
) {
  await supabase.from("error_logs").insert({
    system: "hrm",
    transaction,
    table,
    data,
    error,
  });
}

export async function fetchErrorLogs(perPageCount: number, rangeFrom: number) {
  try {
    let query = supabase.from("error_logs").select("*", { count: "exact" });

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);

    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error", error);
    return { data: [], count: 0 };
  }
}

export interface DocumentFilterTypes {
  filterKeyword?: string;
  filterStatus?: string;
  filterDate?: string;
  filterType?: string;
  filterSchool?: string;
  filterOffice?: string;
  filterRequester?: string;
}

export async function fetchDocuments(
  filters: DocumentFilterTypes,
  filterUrl: string | null,
  userId: string | undefined,
  perPageCount: number,
  rangeFrom: number,
) {
  if (filterUrl && filterUrl === "search") {
    if (
      (typeof filters.filterKeyword === "undefined" ||
        filters.filterKeyword.trim() === "") &&
      (typeof filters.filterRequester === "undefined" ||
        filters.filterRequester === "") &&
      (typeof filters.filterType === "undefined" ||
        filters.filterType === "") &&
      (typeof filters.filterDate === "undefined" ||
        filters.filterDate === "") &&
      (typeof filters.filterStatus === "undefined" ||
        filters.filterStatus === "") &&
      (typeof filters.filterSchool === "undefined" ||
        filters.filterSchool === "") &&
      (typeof filters.filterOffice === "undefined" ||
        filters.filterOffice === "")
    ) {
      return { data: [], count: 0 };
    }
  }

  // If School or Office is selected on filters
  const schoolId =
    typeof filters.filterSchool !== "undefined" && filters.filterSchool !== ""
      ? filters.filterSchool
      : null;

  const officeId =
    typeof filters.filterOffice !== "undefined" && filters.filterOffice !== ""
      ? filters.filterOffice
      : null;

  let userIds: string[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (schoolId || officeId) {
    // Build base query
    let query = supabase.from("hrm_users").select("id");

    // Apply filters
    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }

    if (officeId) {
      query = query.eq("office_id", officeId);
    }

    const { data: usersData, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      userIds = usersData?.map((u: any) => u.id) || [];
    }
  }

  try {
    let query = supabase
      .from("hrm_request_trackers")
      .select(
        "*,leave_cocs:hrm_leave_coc(*), leave_dates:hrm_leave_dates(*), hrm_request_tracker_stickies(*), hrm_tracker_followers(*),creator:created_by(id,firstname,lastname,middlename,gender,birthday,step_increment_leave_days,avatar_url,signature_path,hrm_offices:office_id(*),hrm_positions:position_id(name),position_type,hrm_item:item_id(actual_annual_salary,hrm_position:position_id(name))),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url,signature_path,hrm_positions:position_id(name)),recommender:recommended_by(id,firstname,lastname,middlename,avatar_url,signature_path),certifier:certified_by(id,firstname,lastname,middlename,avatar_url,signature_path),finalapprover:approved_by(id,firstname,lastname,middlename,avatar_url,signature_path),hrm_remarks(*)",
        { count: "exact" },
      );

    if (
      typeof filters.filterKeyword !== "undefined" &&
      filters.filterKeyword.trim() !== ""
    ) {
      query = query.eq("reference_code", filters.filterKeyword.trim());
    }

    // Filter School/Office thru user ids
    if (userIds.length > 0) {
      query = query.in("created_by", userIds);
    }

    // Filter type
    if (
      typeof filters.filterType !== "undefined" &&
      filters.filterType !== ""
    ) {
      query = query.eq("type", filters.filterType);
    }

    // Filter Status
    if (
      typeof filters.filterStatus !== "undefined" &&
      filters.filterStatus !== ""
    ) {
      query = query.eq("current_status", filters.filterStatus);
    }

    // Filter Date
    if (
      typeof filters.filterDate !== "undefined" &&
      filters.filterDate !== ""
    ) {
      query = query.eq("date_created", filters.filterDate);
    }

    // Filter Requester
    if (
      typeof filters.filterRequester !== "undefined" &&
      filters.filterRequester !== ""
    ) {
      query = query.eq("created_by", filters.filterRequester);
    }

    // Following
    if (filterUrl && filterUrl === "following") {
      const docIds: string[] = [];
      const { data }: { data: FollowersTypes[] | null } = await supabase
        .from("hrm_tracker_followers")
        .select()
        .eq("user_id", userId);

      if (data) {
        data.forEach((d) => {
          docIds.push(d.tracker_id);
        });

        query = query.in("id", docIds);
      }
    }

    // Forwarded to me
    if (filterUrl && filterUrl === "forwarded") {
      query = query.eq("receiver_id", userId);
      query = query.eq("current_tracker", "Forwarded");
      query = query.neq("current_status", "Cancelled");
      query = query.neq("current_status", "Disapproved");
      query = query.neq("current_status", "Approved");
    }

    const isDefaultView = !["search", "forwarded", "following"].includes(
      filterUrl ?? "",
    );
    if (isDefaultView) {
      query = query.eq("created_by", userId);
    }

    // Perform count before paginations
    // const { count } = await query

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);
    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });
    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error xx", error);
    return { data: [], count: 0 };
  }
}

export async function fetchLeaveCards(
  userId: string,
  type: string,
  perPageCount: number,
  rangeFrom: number,
) {
  try {
    let query = supabase
      .from("hrm_leave_cards")
      .select(
        "*, hrm_user:user_id(id,firstname,lastname,middlename,avatar_url),updater:updated_by(id,firstname,lastname,middlename,avatar_url)",
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (type !== "") {
      query = query.eq("type", type);
    }

    // Per Page from context
    const from = rangeFrom;
    const to = from + (perPageCount - 1);
    // Per Page from context
    query = query.range(from, to);

    // Order By
    query = query.order("id", { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { data, count };
  } catch (error) {
    console.error("fetch error xx", error);
    return { data: [], count: 0 };
  }
}

export async function handleConvertEmployeeToNonTeaching(
  userId: string,
  dateOfNextIncrement: string,
) {
  // convert employee to non-teaching
  const { error } = await supabase
    .from("hrm_users")
    .update({ position_type: "Non-teaching" })
    .eq("id", userId);

  if (error) {
    void logError(
      "Update employee to non-teaching",
      "hrm_users",
      "",
      error.message,
    );
  }

  // Current Balances
  const { data: balancesData } = await supabase
    .from("hrm_leave_credits")
    .select()
    .eq("user_id", userId);

  const balances: Array<{
    type: string;
    balance: string;
  }> = [];

  if (balancesData && balancesData.length > 0) {
    const creditsData: LeaveCreditTypes[] = balancesData;
    creditsData.forEach((credit) => {
      balances.push({
        type: credit.type,
        balance: credit.credits.toString(),
      });
    });
  }

  // Current Service Credits balance
  const scBalance =
    balances.find((item) => item.type === "Service Credit")?.balance ?? 0;

  // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
  const vlsl = (30 * Number(scBalance)) / 69;
  const vl = (vlsl / 2).toFixed(3);
  const sl = (vlsl / 2).toFixed(3);

  // Update SC to Zero
  const { error: error5 } = await supabase
    .from("hrm_leave_credits")
    .update({
      credits: 0,
    })
    .eq("user_id", userId)
    .eq("type", "Service Credit");

  if (error5) {
    void logError(
      "Create Leave Credit Adjustment",
      "hrm_leave_credits",
      "",
      error5.message,
    );
  }

  // Update VL
  const { error: error2 } = await supabase
    .from("hrm_leave_credits")
    .update({
      credits: vl,
      date_of_next_increment: new Date(dateOfNextIncrement),
    })
    .eq("user_id", userId)
    .eq("type", "Vacation Leave");

  if (error2) {
    void logError(
      "Create Leave Credit Adjustment",
      "hrm_leave_credits",
      "",
      error2.message,
    );
  }

  // Update SL
  const { error: error3 } = await supabase
    .from("hrm_leave_credits")
    .update({
      credits: sl,
      date_of_next_increment: new Date(dateOfNextIncrement),
    })
    .eq("user_id", userId)
    .eq("type", "Sick Leave");

  if (error3) {
    void logError(
      "Create Leave Credit Adjustment",
      "hrm_leave_credits",
      "",
      error3.message,
    );
  }

  // insert the result into leave cards table
  const newData = [
    {
      type: "Sick Leave",
      balance: (vlsl / 2).toFixed(3),
      user_id: userId,
      remarks: "Converted Service Credit to VL/SL",
      particulars: "Sick Leave Adjustment",
    },
    {
      type: "Vacation Leave",
      balance: (vlsl / 2).toFixed(3),
      user_id: userId,
      particulars: "Vacation Leave Adjustment",
      remarks: "Converted Service Credit to VL/SL",
    },
  ];

  const { error: error4 } = await supabase
    .from("hrm_leave_cards")
    .insert(newData);

  if (error4) {
    void logError(
      "Create Leave Card Adjustment from convertion formula",
      "hrm_leave_cards",
      JSON.stringify(newData),
      error4.message,
    );
  }
}

export async function handleConvertEmployeeToTeaching(userId: string) {
  // convert employee to non-teaching
  const { error } = await supabase
    .from("hrm_users")
    .update({ position_type: "Teaching" })
    .eq("id", userId);

  if (error) {
    void logError(
      "Update employee to Teaching",
      "hrm_users",
      "",
      error.message,
    );
  }

  // Current Balances
  const { data: balancesData } = await supabase
    .from("hrm_leave_credits")
    .select()
    .eq("user_id", userId);

  const balances: Array<{
    type: string;
    balance: string;
  }> = [];

  if (balancesData && balancesData.length > 0) {
    const creditsData: LeaveCreditTypes[] = balancesData;
    creditsData.forEach((credit) => {
      balances.push({
        type: credit.type,
        balance: credit.credits.toString(),
      });
    });
  }

  // Current Service Credits balance
  const slBalance =
    balances.find((item) => item.type === "Sick Leave")?.balance ?? 0;
  const vlBalance =
    balances.find((item) => item.type === "Vacation Leave")?.balance ?? 0;

  // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
  const sc = ((Number(slBalance) + Number(vlBalance)) / 30) * 69;

  // Update Service Credit
  const { error: error2 } = await supabase
    .from("hrm_leave_credits")
    .update({
      credits: sc,
    })
    .eq("user_id", userId)
    .eq("type", "Service Credit");

  if (error2) {
    void logError(
      "Create Leave Credit Manual Adjustment",
      "hrm_leave_credits",
      "",
      error2.message,
    );
  }

  // Update VL
  const { error: error4 } = await supabase
    .from("hrm_leave_credits")
    .update({
      credits: 0,
      date_of_next_increment: null,
    })
    .eq("user_id", userId)
    .eq("type", "Vacation Leave");

  if (error4) {
    void logError(
      "Create Leave Credit Adjustment",
      "hrm_leave_credits",
      "",
      error4.message,
    );
  }

  // Update SL
  const { error: error5 } = await supabase
    .from("hrm_leave_credits")
    .update({
      credits: 0,
      date_of_next_increment: null,
    })
    .eq("user_id", userId)
    .eq("type", "Sick Leave");

  if (error5) {
    void logError(
      "Create Leave Credit Adjustment",
      "hrm_leave_credits",
      "",
      error5.message,
    );
  }

  // insert the result into leave cards table
  const newData = {
    type: "Service Credit",
    balance: sc.toFixed(3),
    user_id: userId,
    remarks: "Converted SL/VL to Service Credit",
    particulars: "Service Credit Adjustment",
  };

  const { error: error3 } = await supabase
    .from("hrm_leave_cards")
    .insert(newData);

  if (error3) {
    void logError(
      "Create Leave Card Adjustment from convertion formula",
      "hrm_leave_cards",
      JSON.stringify(newData),
      error3.message,
    );
    throw new Error(error3.message);
  }
}
