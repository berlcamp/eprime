'use client'

import { fetchCtos } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, Unauthorized, CustomButton, DeleteModal, RecordsSideBar } from '@/components'
import { superAdmins } from '@/constants'
import Filters from './Filters'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import AddEditModal from './AddEditModal'
import EmployeesModal from './EmployeesModal'
import { format } from 'date-fns'

// Types
import type { CtoTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedId, setSelectedId] = useState<string>('')
  const [list, setList] = useState<CtoTypes[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<CtoTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchCtos({ filterKeyword, filterStatus }, perPageCount, 0)
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
      const result = await fetchCtos({ filterKeyword, filterStatus }, perPageCount, list.length)

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
    setEditData(null)
  }

  const handleEdit = (item: CtoTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleManageEmployees = (item: CtoTypes) => {
    setShowEmployeesModal(true)
    setEditData(item)
  }

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
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
      <RecordsSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='Compensatory Time Off'/>
            <CustomButton
              containerStyles='app__btn_green'
              title='Create New CTO'
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

          <div className='app__warning_text'><span className='app__warning_title'>Note:</span> CTO with employee/s cannot be deleted.</div>

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
                          COC
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Particulars
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Total Employees
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Duration
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Expiration
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Status
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: CtoTypes, index) => (
                    <tr
                      key={index}
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
                                {
                                  item.status !== 'Revoked' &&
                                    <>
                                    <Menu.Item>
                                      <div
                                          onClick={() => handleEdit(item)}
                                          className='app__dropdown_item'
                                        >
                                          <PencilSquareIcon className='w-4 h-4'/>
                                          <span>Edit</span>
                                        </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div
                                          onClick={() => handleManageEmployees(item)}
                                          className='app__dropdown_item'
                                        >
                                          <PencilSquareIcon className='w-4 h-4'/>
                                          <span>Manage Employees</span>
                                        </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      {
                                        item.hrm_cto_users?.length === 0
                                          ? <div onClick={ () => handleDelete(item.id) } className='app__dropdown_item'>
                                                <TrashIcon className='w-4 h-4'/>
                                                <span>Delete</span>
                                              </div>
                                          : <div className='app__dropdown_item_disabled'><TrashIcon className='w-4 h-4'/><span>Delete</span></div>
                                      }
                                    </Menu.Item>
                                    </>
                                }
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
                            <div className='font-light'>Particulars: {item.particulars}</div>
                            <div className='font-light'>Status:
                              {
                                item.status === 'Expired'
                                  ? <span className='font-medium text-red-500'>Expired</span>
                                  : <span className='font-medium text-green-500'>Active</span>
                              }
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.coc}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.particulars}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>
                          {item.hrm_cto_users?.length}
                        </div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{format(new Date(item.from), 'MMM d, yyyy')} -  {format(new Date(item.to), 'MMM d, yyyy')}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{format(new Date(item.expiration), 'MMM d, yyyy')}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        {
                          item.status === 'Expired'
                            ? <span className='app__status_container_red'>Expired</span>
                            : <span className='app__status_container_green'>Active</span>
                        }
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={8} rows={2}/> }
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
          editData={editData}
          hideModal={() => setShowAddModal(false)}/>
      )
    }

    {/* Employees Modal */}
    {
      showEmployeesModal && (
        <EmployeesModal
          ctoData={editData}
          hideModal={() => setShowEmployeesModal(false)}/>
      )
    }
    {/* Delete Modal */}
    {
      showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table='hrm_ctos'
          hideModal={() => setShowDeleteModal(false)}/>
      )
    }
  </>
  )
}
export default Page
