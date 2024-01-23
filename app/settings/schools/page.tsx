'use client'

import { fetchSchools } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, DeleteModal, TableRowLoading, CustomButton, ShowMore, SettingsSideBar, Title } from '@/components'
import AddEditModal from './AddEditModal'
import uuid from 'react-uuid'
import Filters from './Filters'

// Types
import type { SchoolTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')
  const [list, setList] = useState<SchoolTypes[]>([])
  const [editData, setEditData] = useState<SchoolTypes | null>(null)
  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Filters
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchSchools({ filterKeyword, filterType }, perPageCount, 0)

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
      const result = await fetchSchools({ filterKeyword, filterType }, perPageCount, list.length)

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

  const handleEdit = (item: SchoolTypes) => {
    setShowAddModal(true)
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
  }, [filterKeyword, filterType, perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <>
    <Sidebar>
      <SettingsSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='Schools'/>
            <CustomButton
              containerStyles='app__btn_green'
              title='Add New School'
              btnType='button'
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterType={setFilterType}
              setFilterKeyword={setFilterKeyword}
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
                          School
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Type
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Size & Class
                      </th>
                      <th className="hidden md:table-cell app__th">
                          District
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Head
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
                                      onClick={() => handleEdit(item)}
                                      className='app__dropdown_item'
                                    >
                                      <PencilSquareIcon className='w-4 h-4'/>
                                      <span>Edit</span>
                                    </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                      onClick={ () => handleDelete(item.id) }
                                      className='app__dropdown_item'
                                    >
                                      <TrashIcon className='w-4 h-4'/>
                                      <span>Delete</span>
                                    </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th
                        className="app__th_firstcol">
                        <div>{item.name}</div>
                        <div className='font-light'>{item.school_id}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td space-y-2">
                            <div className='font-light'>Head: {item.hrm_users?.firstname} {item.hrm_users?.middlename} {item.hrm_users?.lastname} </div>
                            <div className='font-light'>Type: {item.type} </div>
                            <div className='font-light'>District: {item.hrm_districts?.name} </div>
                            <div className='font-light'>Class: {item.hrm_users?.firstname} {item.hrm_users?.middlename} {item.hrm_users?.lastname} </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.type}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.size}</div>
                        <div>{item.school_class?.map((item: string) => item).join(', ')}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_districts?.name}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_users?.firstname} {item.hrm_users?.middlename} {item.hrm_users?.lastname}</div>
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={6} rows={2}/> }
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

          {/* Add/Edit Modal */}
          {
            showAddModal && (
              <AddEditModal
                editData={editData}
                hideModal={() => setShowAddModal(false)}/>
            )
          }

          {/* Delete Modal */}
          {
            showDeleteModal && (
              <DeleteModal
                id={selectedId}
                table='hrm_schools'
                hideModal={() => setShowDeleteModal(false)}/>
            )
          }

      </div>
    </div>
  </>
  )
}
export default Page
