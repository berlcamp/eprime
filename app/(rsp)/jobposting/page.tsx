'use client'

import { fetchItems } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, Unauthorized, CustomButton, RecordsSideBar, UserBlock } from '@/components'
import { superAdmins } from '@/constants'
import Filters from './Filters'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import AddEditModal from './AddEditModal'

// Types
import type { ItemTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [list, setList] = useState<ItemTypes[]>([])
  const [filterPosition, setFilterPosition] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterUser, setFilterUser] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<ItemTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchItems({ filterSchool, filterPosition, filterUser }, perPageCount, 0)
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
      const result = await fetchItems({ filterSchool, filterPosition, filterUser }, perPageCount, list.length)

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

  const handleEdit = (item: ItemTypes) => {
    setShowAddModal(true)
    setEditData(item)
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
  }, [perPageCount, filterUser, filterPosition, filterSchool])

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
            <Title title='Plantilla Items'/>
            <CustomButton
              containerStyles='app__btn_green'
              title='Create New Item'
              btnType='button'
              handleClick={handleAdd}
            />
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              setFilterSchool={setFilterSchool}
              setFilterPosition={setFilterPosition}
              setFilterUser={setFilterUser}
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
                          Item Number
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Employee Name
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Type
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Position
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Implementing Unit
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: ItemTypes, index) => (
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
                                  <Menu.Item>
                                    <div
                                        onClick={() => handleEdit(item)}
                                        className='app__dropdown_item'
                                      >
                                        <PencilSquareIcon className='w-4 h-4'/>
                                        <span>Edit</span>
                                      </div>
                                  </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th
                        className="app__th_firstcol">
                        <div className='font-medium'>{item.item_number}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                            {
                              item.hrm_user && <UserBlock user={item.hrm_user}/>
                            }
                            </div>
                            <div><span className='app_td_mobile_label'>Position:</span> {item.hrm_position && <span>{item.hrm_position.name}</span>}</div>
                            <div><span className='app_td_mobile_label'>Implementing Unit:</span> {item.implementing_unit ? <span>{item.implementing_unit.name}</span> : <span>Division</span>}</div>
                            <div>
                              {
                                !item.hrm_user && <div>{item.vacancy_type ? item.vacancy_type : 'New'}</div>
                              }
                            </div>
                            <div>
                              {
                                !item.hrm_user && <span className='app__status_container_green'>Vacant</span>
                              }
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            item.hrm_user && <UserBlock user={item.hrm_user}/>
                          }
                          {
                            !item.hrm_user && <span className='app__status_container_green'>Vacant</span>
                          }
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            !item.hrm_user && <div>{item.vacancy_type ? item.vacancy_type : 'New'}</div>
                          }
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          <span>{item.hrm_position.name}</span>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            item.implementing_unit
                              ? <div>{item.implementing_unit.name}</div>
                              : <div>Division</div>
                          }
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
  </>
  )
}
export default Page
