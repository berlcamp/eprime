'use client'

import { fetchEmployees } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { CheckCircleIcon, ChevronDownIcon, Cog8ToothIcon, CreditCardIcon, PencilSquareIcon, TableCellsIcon, UserIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, EmployeesSideBar, Title, Unauthorized, AccountDetails } from '@/components'
import uuid from 'react-uuid'
import { superAdmins } from '@/constants/TrackerConstants'
import Filters from './Filters'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'

// Types
import type { Employee } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<Employee[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
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

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchEmployees({ filterKeyword, filterSchool, filterOffice, filterSetupStatus }, perPageCount, 0)

      // update the list in redux
      dispatch(updateList(result.data))

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: result.data.length, results: result.count ? result.count : 0 }))
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
      const result = await fetchEmployees({ filterKeyword, filterSchool, filterOffice, filterSetupStatus }, perPageCount, list.length)

      // update the list in redux
      const newList = [...list, ...result.data]
      dispatch(updateList(newList))

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: newList.length, results: result.count ? result.count : 0 }))
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
  }, [filterKeyword, perPageCount, filterSchool, filterSetupStatus, filterOffice])

  const setupCounter = (positionId: number, salaryGrade: string, salaryStep: string) => {
    let count = 1
    if (positionId) count++
    if (salaryGrade !== '' && salaryStep !== '') count++

    return count
  }
  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('employee_accounts') && !superAdmins.includes(session.user.email)) return <Unauthorized/>

  return (
    <>
    <Sidebar>
      <EmployeesSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='Employees'/>
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterSchool={setFilterSchool}
              setFilterOffice={setFilterOffice}
              setFilterSetupStatus={setFilterSetupStatus}
            />
          </div>

          <div className='app__warning_text'><span className='app__warning_title'>Warning:</span> Employees with incomplete account setup will not be included on Automated Leave Card Adjustment System (ALCAS). Use filter &quot;Account Setup&quot; to identify incomplete setup.</div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}/>

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
                          Assignment
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Position
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: any) => (
                    <tr
                      key={uuid()}
                      className="app__tr">
                      <td
                        className="w-6 pl-4 app__td">
                        <Menu as="div" className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
                              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="app__dropdown_items">
                              <div className="py-1">
                                <Menu.Item>
                                  <div
                                      onClick={() => handleViewDetails(item)}
                                      className='app__dropdown_item'
                                    >
                                      <UserIcon className='w-4 h-4'/>
                                      <span>Employee Details</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={() => handleViewDetails(item)}
                                      className='app__dropdown_item'
                                    >
                                      <TableCellsIcon className='w-4 h-4'/>
                                      <span>Service Record</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={() => handleViewDetails(item)}
                                      className='app__dropdown_item'
                                    >
                                      <CreditCardIcon className='w-4 h-4'/>
                                      <span>Leave Card</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={() => handleViewDetails(item)}
                                      className='app__dropdown_item'
                                    >
                                      <PencilSquareIcon className='w-4 h-4'/>
                                      <span>PDS</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={() => handleViewDetails(item)}
                                      className='app__dropdown_item'
                                    >
                                      <PencilSquareIcon className='w-4 h-4'/>
                                      <span>PDF</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={() => handleViewDetails(item)}
                                      className='app__dropdown_item'
                                    >
                                      <Cog8ToothIcon className='w-4 h-4'/>
                                      <span>Account Settings</span>
                                    </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th
                        className="app__th_firstcol">
                        {item.firstname} {item.middlename} {item.lastname}
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <span className='font-light'>School or Office: {item.hrm_schools?.name} {item.hrm_offices?.name} </span>
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden app__td">
                          {
                            item.position_id && item.salary_grade !== '' && item.salary_step !== ''
                              ? <>
                                  <div className='flex items-center space-x-1'>
                                    <CheckCircleIcon className='w-4 h-4 text-green-500'/><span>Complete</span>
                                  </div>
                                </>
                              : <>
                                  <div className='font-semibold'><span className='text-red-600'>{setupCounter(item.position_id, item.salary_grade, item.salary_step)}</span> out of <span className='text-green-600'>3</span> Completed</div>
                                  <div className='space-y-1 mt-2 pl-4'>
                                    <div className='flex items-center space-x-1'>
                                      <CheckCircleIcon className='w-4 h-4 text-green-500'/>
                                      <span>Set Original Assignment</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                      {
                                        item.position_id
                                          ? <CheckCircleIcon className='w-4 h-4 text-green-500'/>
                                          : <XMarkIcon className='w-4 h-4 text-red-500'/>
                                      }
                                      <span>Set current Position</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                      {
                                        item.salary_grade !== '' && item.salary_step !== ''
                                          ? <CheckCircleIcon className='w-4 h-4 text-green-500'/>
                                          : <XMarkIcon className='w-4 h-4 text-red-500'/>
                                      }
                                      <span>Set current Salary Grade</span>
                                    </div>
                                  </div>
                                </>
                          }
                          </div>
                        </div>
                        <div>
                          <div className="md:hidden app__td">
                            <div>{item.hrm_positions?.name}</div>
                            {
                              item.salary_grade !== '' &&
                                <div>
                                  <span>Salary Grade:</span> <span className='font-semibold'>{item.salary_grade} </span>
                                  <span>Step:</span> <span className='font-semibold'>{item.salary_step}</span>
                                </div>
                            }
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>
                          {
                            item.position_id && item.salary_grade !== '' && item.salary_step !== ''
                              ? <>
                                  <div className='flex items-center space-x-1'>
                                    <CheckCircleIcon className='w-4 h-4 text-green-500'/><span>Complete</span>
                                  </div>
                                </>
                              : <>
                                  <div className='font-semibold'><span className='text-red-600'>{setupCounter(item.position_id, item.salary_grade, item.salary_step)}</span> out of <span className='text-green-600'>3</span> Completed</div>
                                  <div className='space-y-1 mt-2 pl-4'>
                                    <div className='flex items-center space-x-1'>
                                      <CheckCircleIcon className='w-4 h-4 text-green-500'/>
                                      <span>Set Original Assignment</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                      {
                                        item.position_id
                                          ? <CheckCircleIcon className='w-4 h-4 text-green-500'/>
                                          : <XMarkIcon className='w-4 h-4 text-red-500'/>
                                      }
                                      <span>Set current Position</span>
                                    </div>
                                    <div className='flex items-center space-x-1'>
                                      {
                                        item.salary_grade !== '' && item.salary_step !== ''
                                          ? <CheckCircleIcon className='w-4 h-4 text-green-500'/>
                                          : <XMarkIcon className='w-4 h-4 text-red-500'/>
                                      }
                                      <span>Set current Salary Grade</span>
                                    </div>
                                  </div>
                                </>
                          }
                        </div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td space-y-1">
                        <div>
                          <div className='font-semibold'>Original Assignment:</div>
                          <div>{item.hrm_schools?.name} {item.hrm_offices?.name}</div>
                        </div>
                        <div>
                          <div className='font-semibold text-green-700'>Current Assignment:</div>
                          <div>{item.hrm_schools?.name} {item.hrm_offices?.name}</div>
                        </div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_positions?.name}</div>
                        {
                          item.salary_grade !== '' &&
                            <div>
                              <span>Salary Grade:</span> <span className='font-semibold'>{item.salary_grade} </span>
                              <span>Step:</span> <span className='font-semibold'>{item.salary_step}</span>
                            </div>
                        }
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={5} rows={2}/> }
              </tbody>
            </table>
            {
              (!loading && isDataEmpty) &&
                <div className='app__norecordsfound'>No records found.</div>
            }
          </div>

          {/* Show More */}
          {
            (resultsCounter.results > resultsCounter.showing && !loading) &&
              <ShowMore
                handleShowMore={handleShowMore}/>
          }
      </div>
    </div>
    {/* Add/Edit Modal */}
    {
      showAccountDetailsModal && (
        <AccountDetails
          id={selectedId}
          hideModal={() => setShowAccountDetailsModal(false)}/>
      )
    }
  </>
  )
}
export default Page
