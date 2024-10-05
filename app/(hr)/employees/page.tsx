'use client'

import {
  AccountDetails,
  CustomButton,
  PerPage,
  RecordsSideBar,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
  UserBlock
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { fetchEmployees } from '@/utils/fetchApi'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { AssignmentTypes, DesignationTypes, Employee } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { superAdmins } from '@/constants'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Employee[]>([])

  // Filters
  const [filterUser, setFilterUser] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterOffice, setFilterOffice] = useState<string>('')
  const [filterSetupStatus, setFilterSetupStatus] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)

  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { hasAccess, session } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchEmployees(
        { filterUser, filterSchool, filterOffice, filterSetupStatus },
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
      const result = await fetchEmployees(
        { filterUser, filterSchool, filterOffice, filterSetupStatus },
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

  const handleViewDetails = (item: Employee) => {
    setSelectedId(item.id)
    setShowAccountDetailsModal(true)
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
  }, [filterUser, perPageCount, filterSchool, filterSetupStatus, filterOffice])

  const setupCounter = (
    positionId: number,
    salaryGrade: string,
    salaryStep: string
  ) => {
    let count = 1
    if (positionId) count++
    if (salaryGrade !== '' && salaryStep !== '') count++

    return count
  }

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (
    !hasAccess('employee_accounts') &&
    !superAdmins.includes(session.user.email)
  )
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <RecordsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Employees" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterUser={setFilterUser}
              setFilterSchool={setFilterSchool}
              setFilterOffice={setFilterOffice}
              setFilterSetupStatus={setFilterSetupStatus}
            />
          </div>

          <div className="app__warning_text">
            <span className="app__warning_title">Warning:</span> Accounts with
            incomplete setup will not be included on Automations such as Leave
            Card Adjustment, NOSI, NOSA. Use filter &quot;Account Setup&quot; to
            identify incomplete setup accounts.
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
                    Account Setup
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
                        <div className="ml-8 mt-2 font-light">
                          <CustomButton
                            btnType="button"
                            title="Account&nbsp;Settings"
                            handleClick={() => handleViewDetails(item)}
                            containerStyles="app__btn_blue"
                          />
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
                            {item.position_id &&
                            item.salary_grade !== '' &&
                            item.salary_step !== '' ? (
                              <>
                                <div className="flex items-center space-x-1">
                                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  <span>Complete</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-semibold">
                                  <span className="text-red-600">
                                    {setupCounter(
                                      item.position_id,
                                      item.salary_grade,
                                      item.salary_step
                                    )}
                                  </span>{' '}
                                  out of{' '}
                                  <span className="text-green-600">3</span>{' '}
                                  Completed
                                </div>
                                <div className="space-y-1 mt-2 pl-4">
                                  <div className="flex items-center space-x-1">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    <span>Set Original Assignment</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {item.position_id ? (
                                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XMarkIcon className="w-4 h-4 text-red-500" />
                                    )}
                                    <span>Set current Position</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {item.salary_grade !== '' &&
                                    item.salary_step !== '' ? (
                                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XMarkIcon className="w-4 h-4 text-red-500" />
                                    )}
                                    <span>Set current Salary Grade</span>
                                  </div>
                                </div>
                              </>
                            )}
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
                      <td className="hidden md:table-cell app__td">
                        <div>
                          {item.position_id &&
                          item.salary_grade !== '' &&
                          item.salary_step !== '' ? (
                            <>
                              <div className="flex items-center space-x-1">
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                <span>Complete</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold">
                                <span className="text-red-600">
                                  {setupCounter(
                                    item.position_id,
                                    item.salary_grade,
                                    item.salary_step
                                  )}
                                </span>{' '}
                                out of <span className="text-green-600">3</span>{' '}
                                Completed
                              </div>
                              <div className="space-y-1 mt-2 pl-4">
                                <div className="flex items-center space-x-1">
                                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  <span>Set Original Assignment</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {item.position_id ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XMarkIcon className="w-4 h-4 text-red-500" />
                                  )}
                                  <span>Set current Position</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {item.salary_grade && item.salary_step ? (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XMarkIcon className="w-4 h-4 text-red-500" />
                                  )}
                                  <span>Set current Salary Grade</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
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
                {loading && <TableRowLoading cols={5} rows={2} />}
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
      {/* Account Details Modal */}
      {showAccountDetailsModal && (
        <AccountDetails
          id={selectedId}
          shouldUpdateRedux={true}
          hideModal={() => setShowAccountDetailsModal(false)}
        />
      )}
    </>
  )
}
export default Page
