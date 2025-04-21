'use client'

import {
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  UserBlock
} from '@/components/index'
import { fetchPersonnel } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type {
  AssignmentTypes,
  DesignationTypes,
  Employee,
  Office,
  SchoolTypes
} from '@/types'

// Redux imports
import PageNotFound from '@/components/PageNotFound'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { UsersIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Employee[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const { hasAccess } = useFilter()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    systemSchools,
    systemOffices,
    session
  }: { systemSchools: SchoolTypes[]; systemOffices: Office[]; session: any } =
    useSupabase()

  let schoolIds: any = []
  let officeIds: any = []

  if (hasAccess('sds') || hasAccess('asds')) {
    schoolIds = systemSchools.map((obj) => obj.id)
    officeIds = systemOffices.map((obj) => obj.id)
  } else {
    const filteredSchools = systemSchools.filter(
      (s) => s.head_user_id === session.user.id
    )

    const filteredOffices = systemOffices.filter(
      (s) => s.head_user_id === session.user.id
    )
    schoolIds = filteredSchools.map((obj) => obj.id)
    officeIds = filteredOffices.map((obj) => obj.id)
  }

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchPersonnel(
        { filterKeyword },
        schoolIds,
        officeIds,
        perPageCount,
        0
      )

      // update the list in redux
      dispatch(updateList(result.data))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true)

    try {
      const result = await fetchPersonnel(
        { filterKeyword },
        schoolIds,
        officeIds,
        perPageCount,
        list.length
      )

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: newList.length,
          results: result.count ? result.count : 0
        })
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKeyword, perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  if (schoolIds.length === 0 && officeIds.length === 0) return <PageNotFound />

  return (
    <>
      <Sidebar>
        <ul className="pt-8 mt-4 space-y-2 border-gray-700">
          <li>
            <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
              <UsersIcon className="w-4 h-4" />
              <span>Personnel</span>
            </div>
          </li>
        </ul>
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Personnel" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterKeyword={setFilterKeyword} />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="hidden md:table-cell app__th pl-4"></th>
                  <th className="hidden md:table-cell app__th">
                    Employee Name
                  </th>
                  <th className="hidden md:table-cell app__th">
                    Assignment/Designation
                  </th>
                  <th className="hidden md:table-cell app__th">Position</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: Employee, index) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td"></td>
                      <th className="app__th_firstcol">
                        <Link href={`/profile/${item.id}`}>
                          <UserBlock user={item} />
                        </Link>
                        <div className="ml-8 font-light">{item.email}</div>
                        <div className="ml-8 font-light">
                          {item.position_type}
                        </div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <span className="font-light">
                              School or Office: {item.hrm_schools?.name}{' '}
                              {item.hrm_offices?.name}{' '}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden app__td">
                            <div>{item.hrm_positions?.name}</div>
                            {item.salary_grade !== '' && (
                              <div>
                                <span>Salary Grade:</span>{' '}
                                <span className="font-semibold">
                                  {item.salary_grade}{' '}
                                </span>
                                <span>Step:</span>{' '}
                                <span className="font-semibold">
                                  {item.salary_step}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td space-y-1">
                        <div>
                          <div className="font-semibold">
                            Original Assignment:
                          </div>
                          <div>
                            {item.hrm_schools?.name} {item.hrm_offices?.name}
                          </div>
                        </div>
                        {item.hrm_assignments.length > 0 &&
                          item.hrm_assignments.map(
                            (assignment: AssignmentTypes, index) =>
                              assignment.status === 'Active' &&
                              assignment.type === 'Re-assignment' && (
                                <div key={index}>
                                  <div className="font-semibold text-green-700">
                                    Current Assignment:
                                  </div>
                                  {assignment.area_assigned === 'office' ? (
                                    <span>{assignment.hrm_offices?.name}</span>
                                  ) : (
                                    <span>{assignment.hrm_schools?.name}</span>
                                  )}
                                </div>
                              )
                          )}
                        {item.hrm_designations.length > 0 &&
                          item.hrm_designations.map(
                            (designation: DesignationTypes, index) =>
                              designation.status === 'Active' && (
                                <div key={index}>
                                  <div className="font-semibold text-green-700">
                                    Current Designation:
                                  </div>
                                  {designation.type === 'Function only' ? (
                                    <span>{designation.designation}</span>
                                  ) : designation.area_assigned === 'office' ? (
                                    <span>
                                      {designation.designation} -{' '}
                                      {designation.hrm_offices?.name}
                                    </span>
                                  ) : (
                                    <span>
                                      {designation.designation} -{' '}
                                      {designation.hrm_schools?.name}
                                    </span>
                                  )}
                                </div>
                              )
                          )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.hrm_positions?.name}</div>
                        {item.salary_grade && item.salary_step && (
                          <div>
                            <span>Salary Grade:</span>{' '}
                            <span className="font-semibold">
                              {item.salary_grade}{' '}
                            </span>
                            <span>Step:</span>{' '}
                            <span className="font-semibold">
                              {item.salary_step}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={4} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>
    </>
  )
}
export default Page
