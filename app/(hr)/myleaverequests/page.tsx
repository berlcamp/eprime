'use client'

import { fetchMyLeaveRequests } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ArchiveBoxXMarkIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, Unauthorized, CustomButton, RequestsSideBar, UserBlock } from '@/components'
import uuid from 'react-uuid'
import { superAdmins } from '@/constants/TrackerConstants'
import Filters from './Filters'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { capitalizeWords } from '@/utils/text-helper'
import AddEditModal from './AddEditModal'
import { format } from 'date-fns'

// Types
import type { LeaveTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import Link from 'next/link'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [list, setList] = useState<LeaveTypes[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchMyLeaveRequests({ filterKeyword, filterStatus }, perPageCount, 0)
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
      const result = await fetchMyLeaveRequests({ filterKeyword, filterStatus }, perPageCount, list.length)

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

  const handleAdd = () => {
    setShowAddModal(true)
  }

  const handleCancel = (id: string) => {
    //
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
  }, [filterKeyword, perPageCount, filterStatus])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('records') && !superAdmins.includes(session.user.email)) return <Unauthorized/>

  return (
    <>
    <Sidebar>
      <RequestsSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='Leave Requests'/>
            <CustomButton
              containerStyles='app__btn_green'
              title='Create New Leave Requests'
              btnType='button'
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterStatus={setFilterStatus}
            />
          </div>

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
                          Reference Code
                      </th>
                      <th className="hidden md:table-cell app__th">
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Requester
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Status
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Type
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Duration
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: LeaveTypes) => (
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
                                      onClick={() => handleCancel(item.id)}
                                      className='app__dropdown_item'
                                    >
                                      <ArchiveBoxXMarkIcon className='w-4 h-4'/>
                                      <span>Cancel This Request</span>
                                    </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th
                        className="app__th_firstcol">
                        <div>{item.reference_code}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <div>{capitalizeWords(item.requester?.firstname + ' ' + item.requester?.middlename + ' ' + item.requester?.lastname)}</div>
                            <div className='font-light'>Duration: {item.from} -  {item.to}</div>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                          <Link href={`/leaverequests/${item.reference_code}`}>
                            <CustomButton
                              containerStyles='app__btn_green'
                              title='Leave Details'
                              btnType='button'/>
                          </Link>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <UserBlock user={item.requester}/>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {/* HR Status */}
                          <div>
                            <div className='mb-1 font-medium'>HRMO:</div>
                            {item.hr_status === 'Pending' && <span className='app__status_container_orange'>Pending</span>}
                            {item.hr_status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                            {item.hr_status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                          </div>
                          {/* Recommending Status */}
                          <div>
                          <div className='mb-1 mt-2 font-medium'>Recommendation:</div>
                            {item.recommending_status === 'Pending' && <span className='app__status_container_orange'>Pending</span>}
                            {item.recommending_status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                            {item.recommending_status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                          </div>
                          {/* SDS Status */}
                          <div>
                            <div className='mb-1 mt-2 font-medium'>Final Approval:</div>
                            {item.approver_status === 'Pending' && <span className='app__status_container_orange'>Pending</span>}
                            {item.approver_status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                            {item.approver_status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                          </div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.type}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.days} days</div>
                        <div>{format(new Date(item.from), 'MMM d, yyyy')} -  {format(new Date(item.to), 'MMM d, yyyy')}</div>
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={7} rows={2}/> }
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
      showAddModal && (
        <AddEditModal
          hideModal={() => setShowAddModal(false)}/>
      )
    }
  </>
  )
}
export default Page
