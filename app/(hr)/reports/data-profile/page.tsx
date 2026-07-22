/* eslint-disable @typescript-eslint/no-non-null-assertion */
'use client'

import {
  CustomButton,
  Sidebar,
  Title,
  TopBar,
  TwoColTableLoading,
  Unauthorized
} from '@/components/index'
import ReportsSidebar from '@/components/Sidebars/ReportsSidebar'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { type PositionTypes, type SchoolTypes } from '@/types'
import { fetchPositions, fetchSchools } from '@/utils/fetchApi'
import { TagIcon } from '@heroicons/react/20/solid'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import { useEffect, useState } from 'react'

const DIVISION = 'Schools Division Office of Bayugan City'

const KEY_STAGES: Record<string, string[]> = {
  'Key Stage 1 (Kinder - Grade 3)': [
    'Kinder',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3'
  ],
  'Key Stage 2 (Grades 4 - 6)': ['Grade 4', 'Grade 5', 'Grade 6'],
  'Key Stage 3 (Grades 7 - 10)': [
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10'
  ],
  'Key Stage 4 (Grades 11 - 12)': ['Grade 11', 'Grade 12']
}

const GRADE_ORDER = [
  'Kinder',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12'
]

// Eligibility entries that represent a PRC teaching license
const PRC_KEYWORDS = [
  'PRC',
  'LET',
  'LICENSURE EXAMINATION FOR TEACH',
  'PBET',
  'PROFESSIONAL BOARD EXAM',
  'PROFESSIONAL TEACHER'
]

interface EligibilityRowTypes {
  eligibility?: string
  license_number?: string
  license_validity?: string
}

interface EducationRowTypes {
  level?: string
  course?: string
  level_earned?: string
}

interface ProfileRowTypes {
  id: string
  fullname: string
  sex: string
  age: string
  civilStatus: string
  religion: string
  division: string
  schoolName: string
  schoolId: string
  positionLevel: string
  yearsInPosition: string
  collegeSpecialization: string
  graduateSpecialization: string
  gradeLevels: string
  subjects: string
  depedEmail: string
  prcNumber: string
  prcValidity: string
  pwd: string
  pwdDetail: string
  ipGroup: string
  ipGroupDetail: string
  soloParent: string
  soloParentDetail: string
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const yearsSince = (date: string | null | undefined) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  const monthDiff = now.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    years--
  }
  return years >= 0 ? years.toString() : ''
}

export default function Page() {
  const [filterSchool, setFilterSchool] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [filterKeyStage, setFilterKeyStage] = useState('')

  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedKeyStage, setSelectedKeyStage] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[]>([])
  const [positions, setPositions] = useState<PositionTypes[]>([])

  const [list, setList] = useState<ProfileRowTypes[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const { hasAccess } = useFilter()
  const { supabase, session } = useSupabase()

  const handleApply = () => {
    setFilterSchool(selectedSchool)
    setFilterPosition(selectedPosition)
    setFilterKeyStage(selectedKeyStage)
  }

  const handleClear = () => {
    setSelectedSchool('')
    setSelectedPosition('')
    setSelectedKeyStage('')
    setFilterSchool('')
    setFilterPosition('')
    setFilterKeyStage('')
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('hrm_users')
        .select(
          `
          id,
          firstname,
          middlename,
          lastname,
          gender,
          email,
          birthday,
          joining_date,
          date_of_last_promotion,
          position_type,
          grade_levels:hrm_personnel_grade_levels(grade_level),
          subjects:hrm_personnel_subjects(subject:subject_id(title)),
          hrm_schools:school_id(name, school_id),
          hrm_positions:position_id(name),
          hrm_item:item_id(
            date_of_last_promotion,
            hrm_position:position_id(name)
          )
        `
        )
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID!)
        .eq('status', 'Active')
        .not('item_id', 'is', null)
        .order('lastname', { ascending: true })

      if (filterSchool !== '') {
        query = query.eq('school_id', filterSchool)
      }

      if (filterPosition !== '') {
        query = query.eq('position_id', filterPosition)
      }

      const { data: users, error } = await query

      if (error) throw new Error(error.message)

      let rows = users ?? []

      // Filter by key stage using the personnel grade levels
      if (filterKeyStage !== '') {
        const stageLevels = KEY_STAGES[filterKeyStage] ?? []
        rows = rows.filter((user: any) =>
          (user.grade_levels ?? []).some((lvl: any) =>
            stageLevels.includes(lvl.grade_level)
          )
        )
      }

      const userIds = rows.map((user: any) => user.id)

      // PDS holds civil status, educational background and eligibility (PRC)
      let pdsData: any[] = []
      // Applicant records hold the social profile and DepEd email
      let applicantData: any[] = []

      if (userIds.length > 0) {
        const { data: pds } = await supabase
          .from('hrm_pds')
          .select(
            'user_id, civil_status, birthday, educational_background, eligibility, religion, deped_email, pwd, pwd_detail, ip_group, ip_group_detail, solo_parent, solo_parent_detail'
          )
          .in('user_id', userIds)
        pdsData = pds ?? []

        const { data: applicants } = await supabase
          .from('hrm_ranking_applicants')
          .select(
            'user_id, created_at, religion, disability, ethnicity, ethnicity_detail, solo_parent, solo_parent_detail, deped_email, civil_status, sex'
          )
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
        applicantData = applicants ?? []
      }

      const profiles: ProfileRowTypes[] = rows.map((user: any) => {
        const pds = pdsData.find((p: any) => p.user_id === user.id)
        // Most recent applicant record for this employee
        const applicant = applicantData.find((a: any) => a.user_id === user.id)

        const education: EducationRowTypes[] = Array.isArray(
          pds?.educational_background
        )
          ? pds.educational_background
          : []
        const eligibility: EligibilityRowTypes[] = Array.isArray(
          pds?.eligibility
        )
          ? pds.eligibility
          : []

        const college = education.find((e) => e.level === 'College')
        const graduate = education.find((e) => e.level === 'Graduate Studies')

        const prc = eligibility.find((e) =>
          PRC_KEYWORDS.some((keyword) =>
            (e.eligibility ?? '').toUpperCase().includes(keyword)
          )
        )

        const gradeLevels = (user.grade_levels ?? [])
          .map((lvl: any) => lvl.grade_level)
          .sort(
            (a: string, b: string) =>
              GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
          )
          .join(', ')

        const subjects = (user.subjects ?? [])
          .map((s: any) => s.subject?.title)
          .filter((title: string | undefined) => !!title)
          .join(', ')

        const birthday = user.birthday ?? pds?.birthday
        const inPositionSince =
          user.hrm_item?.date_of_last_promotion ??
          user.date_of_last_promotion ??
          user.joining_date

        return {
          id: user.id,
          fullname: `${user.lastname ?? ''}, ${user.firstname ?? ''} ${
            user.middlename ?? ''
          }`.trim(),
          sex: user.gender ?? applicant?.sex ?? '',
          age: yearsSince(birthday),
          civilStatus: pds?.civil_status ?? applicant?.civil_status ?? '',
          religion: pds?.religion || (applicant?.religion ?? ''),
          division: DIVISION,
          schoolName: user.hrm_schools?.name ?? '',
          schoolId: user.hrm_schools?.school_id ?? '',
          positionLevel:
            user.hrm_item?.hrm_position?.name ?? user.hrm_positions?.name ?? '',
          yearsInPosition: yearsSince(inPositionSince),
          collegeSpecialization: college?.course ?? '',
          graduateSpecialization: graduate?.course ?? '',
          gradeLevels,
          subjects,
          depedEmail: pds?.deped_email || (applicant?.deped_email ?? ''),
          prcNumber: prc?.license_number ?? '',
          prcValidity: formatDate(prc?.license_validity),
          pwd: pds?.pwd || (applicant?.disability ?? ''),
          pwdDetail: pds?.pwd_detail ?? '',
          ipGroup: pds?.ip_group || (applicant?.ethnicity ?? ''),
          ipGroupDetail:
            pds?.ip_group_detail || (applicant?.ethnicity_detail ?? ''),
          soloParent: pds?.solo_parent || (applicant?.solo_parent ?? ''),
          soloParentDetail:
            pds?.solo_parent_detail || (applicant?.solo_parent_detail ?? '')
        }
      })

      setList(profiles)
    } catch (error) {
      console.error('fetch data profile error', error)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)

    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Data Profile')

    worksheet.columns = [
      { header: 'No.', key: 'no', width: 6 },
      // a. Basic Information
      { header: 'Full Name', key: 'fullname', width: 35 },
      { header: 'Sex', key: 'sex', width: 10 },
      { header: 'Age', key: 'age', width: 8 },
      { header: 'Civil Status', key: 'civil_status', width: 15 },
      { header: 'Religion', key: 'religion', width: 20 },
      // b. Professional Details
      { header: 'Division', key: 'division', width: 35 },
      { header: 'School Name', key: 'school_name', width: 35 },
      { header: 'School ID', key: 'school_id', width: 15 },
      { header: 'Position Level', key: 'position_level', width: 25 },
      {
        header: 'Years in Current Position',
        key: 'years_in_position',
        width: 22
      },
      // c. Academic Background
      {
        header: 'College Specialization',
        key: 'college_specialization',
        width: 35
      },
      {
        header: 'Graduate Studies Specialization',
        key: 'graduate_specialization',
        width: 35
      },
      // d. Current Assignment
      { header: 'Grade Level(s) Taught', key: 'grade_levels', width: 30 },
      {
        header: 'Actual Subjects / Learning Areas Taught',
        key: 'subjects',
        width: 40
      },
      // e. Administrative Data
      { header: 'DepEd Email Address', key: 'deped_email', width: 35 },
      { header: 'PRC ID Number', key: 'prc_number', width: 18 },
      { header: 'PRC License Validity', key: 'prc_validity', width: 18 },
      // f. Social Profile
      { header: 'PWD', key: 'pwd', width: 12 },
      { header: 'PWD Specification', key: 'pwd_detail', width: 25 },
      { header: 'IP Group Member', key: 'ip_group', width: 15 },
      { header: 'IP Group Specification', key: 'ip_group_detail', width: 25 },
      { header: 'Solo Parent', key: 'solo_parent', width: 15 },
      {
        header: 'Solo Parent Specification',
        key: 'solo_parent_detail',
        width: 25
      }
    ]

    worksheet.getRow(1).font = { bold: true }

    list.forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        fullname: item.fullname,
        sex: item.sex,
        age: item.age,
        civil_status: item.civilStatus,
        religion: item.religion,
        division: item.division,
        school_name: item.schoolName,
        school_id: item.schoolId,
        position_level: item.positionLevel,
        years_in_position: item.yearsInPosition,
        college_specialization: item.collegeSpecialization,
        graduate_specialization: item.graduateSpecialization,
        grade_levels: item.gradeLevels,
        subjects: item.subjects,
        deped_email: item.depedEmail,
        prc_number: item.prcNumber,
        prc_validity: item.prcValidity,
        pwd: item.pwd,
        pwd_detail: item.pwdDetail,
        ip_group: item.ipGroup,
        ip_group_detail: item.ipGroupDetail,
        solo_parent: item.soloParent,
        solo_parent_detail: item.soloParentDetail
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    saveAs(blob, 'Teachers Data Profile.xlsx')

    setDownloading(false)
  }

  useEffect(() => {
    const fetchFilterData = async () => {
      const schoolsResult = await fetchSchools({}, 300, 0)
      const positionsResult = await fetchPositions('', 999, 0)
      setSchools(schoolsResult.data.length > 0 ? schoolsResult.data : [])
      setPositions(
        positionsResult.data && positionsResult.data.length > 0
          ? positionsResult.data
          : []
      )
    }
    void fetchFilterData()
  }, [])

  useEffect(() => {
    void fetchData()
  }, [filterSchool, filterPosition, filterKeyStage])

  // Check access from permission settings or Super Admins
  if (
    !hasAccess('records') &&
    !hasAccess('settings') &&
    !hasAccess('hr') &&
    !hasAccess('asds') &&
    !hasAccess('sds') &&
    !superAdmins.includes(session?.user.email ?? '')
  )
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <ReportsSidebar />
      </Sidebar>
      <TopBar />

      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Data Profile" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <div className="items-center space-y-1">
              <div className="app__filter_container">
                <TagIcon className="w-4 h-4 mr-1" />
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="app__filter_select"
                >
                  <option value="">All Schools</option>
                  {schools.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="app__filter_container">
                <TagIcon className="w-4 h-4 mr-1" />
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="app__filter_select"
                >
                  <option value="">All Positions</option>
                  {positions.map((item, index) => (
                    <option key={index} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="app__filter_container">
                <TagIcon className="w-4 h-4 mr-1" />
                <select
                  value={selectedKeyStage}
                  onChange={(e) => setSelectedKeyStage(e.target.value)}
                  className="app__filter_select"
                >
                  <option value="">All Key Stages</option>
                  {Object.keys(KEY_STAGES).map((stage, index) => (
                    <option key={index} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <CustomButton
                containerStyles="app__btn_green"
                title="Apply Filter"
                btnType="button"
                handleClick={handleApply}
              />
              <CustomButton
                containerStyles="app__btn_gray"
                title="Clear Filter"
                btnType="button"
                handleClick={handleClear}
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="mx-4 mb-4 flex justify-between items-end space-x-2">
            <div className="text-xs text-gray-600">
              {loading ? '' : `${list.length} teacher(s)`}
            </div>
            <CustomButton
              containerStyles="app__btn_blue"
              isDisabled={downloading || loading || list.length === 0}
              title={downloading ? 'Downloading...' : 'Export Data To Excel'}
              btnType="button"
              handleClick={handleDownloadExcel}
            />
          </div>

          {loading && <TwoColTableLoading />}
          {!loading && (
            <div className="mx-4 mb-4 overflow-x-auto">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">No.</th>
                    <th className="app__th">Full Name</th>
                    <th className="app__th">Sex</th>
                    <th className="app__th">Age</th>
                    <th className="app__th">Civil Status</th>
                    <th className="app__th">Religion</th>
                    <th className="app__th">Division</th>
                    <th className="app__th">School Name</th>
                    <th className="app__th">School ID</th>
                    <th className="app__th">Position Level</th>
                    <th className="app__th">Years in Current Position</th>
                    <th className="app__th">College Specialization</th>
                    <th className="app__th">Graduate Studies Specialization</th>
                    <th className="app__th">Grade Level(s) Taught</th>
                    <th className="app__th">Subjects / Learning Areas</th>
                    <th className="app__th">DepEd Email</th>
                    <th className="app__th">PRC ID No.</th>
                    <th className="app__th">PRC Validity</th>
                    <th className="app__th">PWD</th>
                    <th className="app__th">IP Group</th>
                    <th className="app__th">Solo Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && (
                    <tr className="app__tr">
                      <td className="app__td" colSpan={21}>
                        No records found.
                      </td>
                    </tr>
                  )}
                  {list.map((item, index) => (
                    <tr key={item.id} className="app__tr">
                      <td className="app__td">{index + 1}</td>
                      <td className="app__td whitespace-nowrap">
                        {item.fullname}
                      </td>
                      <td className="app__td">{item.sex}</td>
                      <td className="app__td">{item.age}</td>
                      <td className="app__td">{item.civilStatus}</td>
                      <td className="app__td">{item.religion}</td>
                      <td className="app__td">{item.division}</td>
                      <td className="app__td">{item.schoolName}</td>
                      <td className="app__td">{item.schoolId}</td>
                      <td className="app__td">{item.positionLevel}</td>
                      <td className="app__td">{item.yearsInPosition}</td>
                      <td className="app__td">{item.collegeSpecialization}</td>
                      <td className="app__td">{item.graduateSpecialization}</td>
                      <td className="app__td">{item.gradeLevels}</td>
                      <td className="app__td">{item.subjects}</td>
                      <td className="app__td">{item.depedEmail}</td>
                      <td className="app__td">{item.prcNumber}</td>
                      <td className="app__td">{item.prcValidity}</td>
                      <td className="app__td">
                        {item.pwd}
                        {item.pwdDetail ? ` - ${item.pwdDetail}` : ''}
                      </td>
                      <td className="app__td">
                        {item.ipGroup}
                        {item.ipGroupDetail ? ` - ${item.ipGroupDetail}` : ''}
                      </td>
                      <td className="app__td">
                        {item.soloParent}
                        {item.soloParentDetail
                          ? ` - ${item.soloParentDetail}`
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
