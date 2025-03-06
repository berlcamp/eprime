'use client'

import {
  CustomButton,
  Sidebar,
  Title,
  TopBar,
  TwoColTableLoading,
  Unauthorized
} from '@/components'
import ReportsSidebar from '@/components/Sidebars/ReportsSidebar'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  Employee,
  MajorTypes,
  PersonnelCoordinatorshipTypes,
  PersonnelMajorTypes,
  PersonnelSubjectTypes,
  SubjectTypes
} from '@/types'
import { fetchSubjects } from '@/utils/fetchApi'
import Excel from 'exceljs'
import { saveAs } from 'file-saver'
import { useEffect, useState } from 'react'
import Filters from './Filters'

export default function Page() {
  //
  const [filterSchool, setFilterSchool] = useState('')
  const [filterMajor, setFilterMajor] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterCoodinatorship, setFilterCoodinatorship] = useState('')

  const [list, setList] = useState<Employee[]>([])

  const [downloading, setDownloading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<SubjectTypes[]>([])
  const [majors, setMajors] = useState<MajorTypes[]>([])

  const { hasAccess } = useFilter()
  const { supabase, session } = useSupabase()

  const fetchData = async () => {
    setLoading(true)
    try {
      const userIds = []

      // If filter by major is selected
      if (filterMajor !== '') {
        const { data } = await supabase
          .from('hrm_personnel_majors')
          .select()
          .eq('major_id', filterMajor)
        if (data && data.length > 0) {
          data.forEach((d: PersonnelMajorTypes) => {
            userIds.push(d.user_id)
          })
        } else {
          userIds.push('999999e9-9999-999f-8709-c94fd3dbb72f') // fake uuid
        }
      }

      // If filter by subject is selected
      if (filterSubject !== '') {
        const { data } = await supabase
          .from('hrm_personnel_subjects')
          .select()
          .eq('subject_id', filterSubject)
        if (data && data.length > 0) {
          data.forEach((d: PersonnelSubjectTypes) => {
            userIds.push(d.user_id)
          })
        } else {
          userIds.push('999999e9-9999-999f-8709-c94fd3dbb72f') // fake uuid
        }
      }

      // If filter by coordinatorhip is selected
      if (filterSubject !== '') {
        const { data } = await supabase
          .from('hrm_personnel_coordinatorships')
          .select()
          .eq('coordinatorship_id', filterSubject)
        if (data && data.length > 0) {
          data.forEach((d: PersonnelCoordinatorshipTypes) => {
            userIds.push(d.user_id)
          })
        } else {
          userIds.push('999999e9-9999-999f-8709-c94fd3dbb72f') // fake uuid
        }
      }

      let query = supabase
        .from('hrm_users')
        .select(
          '*, grade_levels:hrm_personnel_grade_levels(*), coordinatorships:hrm_personnel_coordinatorships(*,coordinatorship:coordinatorship_id(*)),majors:hrm_personnel_majors(*,major:major_id(*)), subjects:hrm_personnel_subjects(*,subject:subject_id(*)), hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_assignments(status,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name)), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))',
          { count: 'exact' }
        )

      if (filterSchool !== '') {
        query = query.eq('school_id', filterSchool)
      }

      if (userIds.length > 0) {
        query = query.in('id', userIds)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      } else {
        setList(data)
      }
    } catch (error) {
      console.error('fetch my promotions error', error)
      return { data: [], count: 0 }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)

    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook()
    const worksheet = workbook.addWorksheet('Sheet 1')

    // Add data to the worksheet
    worksheet.columns = [
      { header: 'No.', key: 'no', width: 20 },
      { header: 'Last Name', key: 'lastname', width: 20 },
      { header: 'First Name', key: 'firstname', width: 20 },
      { header: 'Middle Name', key: 'middlename', width: 20 },
      { header: 'School', key: 'school', width: 20 },
      { header: 'Subjects', key: 'subjects', width: 20 },
      { header: 'Majors', key: 'majors', width: 20 },
      { header: 'Coordinatorships', key: 'coordinatorships', width: 20 }
      // Add more columns based on your data structure
    ]

    // Data for the Excel file
    const data: any[] = []
    list.forEach((item, index) => {
      // For Subjects Column
      let subjects = ''
      item.subjects?.forEach((item) => {
        subjects += `\n ${item.subject.title}`
      })
      // For Majors Column
      let majors = ''
      item.majors?.forEach((item) => {
        majors += `\n ${item.major.title}`
      })
      // For Coordinatorship Column
      let coordinatorships = ''
      item.coordinatorships?.forEach((item) => {
        coordinatorships += `\n ${item.coordinatorship.title}`
      })

      data.push({
        no: index + 1,
        lastname: `${item.lastname}`,
        firstname: `${item.lastname}`,
        middlename: `${item.lastname}`,
        school: `${item.hrm_schools?.name}`,
        subjects,
        majors,
        coordinatorships
      })
    })

    data.forEach((item) => {
      worksheet.addRow(item)
    })

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      saveAs(blob, 'Personnel Report.xlsx')
    })
    setDownloading(false)
  }

  useEffect(() => {
    const fetchSubjectsData = async () => {
      const result = await fetchSubjects(999, 0)
      setSubjects(result.data.length > 0 ? result.data : [])
    }
    const fetchMajorsData = async () => {
      const { data } = await supabase.from('hrm_majors').select()
      if (data) {
        setMajors(data)
      }
    }

    void fetchMajorsData()
    void fetchSubjectsData()
  }, [])

  useEffect(() => {
    void fetchData()
  }, [filterSchool, filterMajor, filterSubject, filterCoodinatorship])

  // Check access from permission settings or Super Admins
  if (
    !hasAccess('records') &&
    !hasAccess('settings') &&
    !hasAccess('hr') &&
    !hasAccess('asds') &&
    !hasAccess('sds') &&
    !superAdmins.includes(session.user.email)
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
            <Title title="Personnels" />
          </div>
          {/* Filters */}
          <div className="app__filters">
            <Filters
              subjects={subjects}
              majors={majors}
              setFilterSchool={setFilterSchool}
              setFilterMajor={setFilterMajor}
              setFilterSubject={setFilterSubject}
              setFilterCoodinatorship={setFilterCoodinatorship}
            />
          </div>
          {/* Export Button */}
          <div className="mx-4 mb-4 flex justify-end items-end space-x-2">
            <CustomButton
              containerStyles="app__btn_blue"
              isDisabled={downloading}
              title={downloading ? 'Downloading...' : 'Export Data To Excel'}
              btnType="button"
              handleClick={handleDownloadExcel}
            />
          </div>
          <div>
            {loading && <TwoColTableLoading />}
            {!loading && (
              <div className="w-full px-2 pt-4 bg-gray-100">
                <div className="container mx-auto p-2 lg:grid lg:grid-cols-2 lg:gap-2">
                  <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
                    <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                      <div className="flex space-x-2 items-center">
                        <span>Sex</span>
                      </div>
                    </div>
                    <div className="items-center">
                      <div className="inline-flex flex-col text-center border-r px-2">
                        <div className="text-xs text-gray-500">Male</div>
                        <div className="text-xs text-gray-700 font-bold">
                          {list.filter((item) => item.gender === 'Male').length}
                        </div>
                      </div>
                      <div className="inline-flex flex-col text-center border-r px-2">
                        <div className="text-xs text-gray-500">Female</div>
                        <div className="text-xs text-gray-700 font-bold">
                          {
                            list.filter((item) => item.gender === 'Female')
                              .length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
                    <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                      <div className="flex space-x-2 items-center">
                        <span>Position Type</span>
                      </div>
                    </div>
                    <div className="space-x-1 items-center">
                      <div className="inline-flex flex-col text-center border-r px-2">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-xs text-gray-700 font-bold">
                          {list.length}
                        </div>
                      </div>
                      <div className="inline-flex flex-col text-center border-r px-2">
                        <div className="text-xs text-gray-500">Teaching</div>
                        <div className="text-xs text-gray-700 font-bold">
                          {
                            list.filter(
                              (item) => item.position_type === 'Teaching'
                            ).length
                          }
                        </div>
                      </div>
                      <div className="inline-flex flex-col text-center border-r px-2">
                        <div className="text-xs text-gray-500">
                          Teaching-Related
                        </div>
                        <div className="text-xs text-gray-700 font-bold">
                          {
                            list.filter(
                              (item) =>
                                item.position_type === 'Teaching-Related'
                            ).length
                          }
                        </div>
                      </div>
                      <div className="inline-flex flex-col text-center border-r px-2">
                        <div className="text-xs text-gray-500">
                          Non-teaching
                        </div>
                        <div className="text-xs text-gray-700 font-bold">
                          {
                            list.filter(
                              (item) => item.position_type === 'Non-teaching'
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
                    <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                      <div className="flex space-x-2 items-center">
                        <span>Subjects</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <table className="app__table">
                        <thead className="app__thead">
                          <tr>
                            <th className="app__th">Subject</th>
                            <th className="app__th">Total Personnels</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjects?.map((item) => (
                            <tr key={item.id} className="app__tr">
                              <td className="app__td">{item.title}</td>
                              <td className="app__td">
                                {
                                  list.filter((personnel) =>
                                    personnel.subjects.some(
                                      (subject) =>
                                        subject.subject_id === item.id
                                    )
                                  ).length
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
                    <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                      <div className="flex space-x-2 items-center">
                        <span>Majors</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <table className="app__table">
                        <thead className="app__thead">
                          <tr>
                            <th className="app__th">Major</th>
                            <th className="app__th">Total Personnels</th>
                          </tr>
                        </thead>
                        <tbody>
                          {majors?.map((item) => (
                            <tr key={item.id} className="app__tr">
                              <td className="app__td">{item.title}</td>
                              <td className="app__td">
                                {
                                  list.filter((personnel) =>
                                    personnel.majors.some(
                                      (major) => major.major_id === item.id
                                    )
                                  ).length
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
