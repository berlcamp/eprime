'use client'

import { fetchPromotions } from '@/utils/fetchApi'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ArrowLeftIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, Unauthorized, CustomButton, DeleteModal, RecordsSideBar, UserBlock } from '@/components'
import uuid from 'react-uuid'
import { superAdmins } from '@/constants'
import Filters from './Filters'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import AddEditModal from './AddEditModal'

// Types
import type { PromotionTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { format } from 'date-fns'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import DetailsModal from './DetailsModal'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<PromotionTypes | null>(null)

  const [list, setList] = useState<PromotionTypes[]>([])
  const [filterPosition, setFilterPosition] = useState<string>('')
  const [filterUser, setFilterUser] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<PromotionTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  const searchParams = useSearchParams()
  const filterUrl = searchParams.get('ref')

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchPromotions({ filterPosition, filterUser }, filterUrl, perPageCount, 0)
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
      const result = await fetchPromotions({ filterPosition, filterUser }, filterUrl, perPageCount, list.length)

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

  const handleEdit = (item: PromotionTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleViewDetails = (item: PromotionTypes) => {
    setSelectedItem(item)
    setShowDetailsModal(true)
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
  }, [perPageCount, filterUser, filterPosition])

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
        {
          filterUrl &&
            <div className='app__title'>
              <Link href="/promotions" className='flex items-center app__btn_gray'>
                <ArrowLeftIcon className='w-5 h-5'/>
                View All Promotions
              </Link>
            </div>
        }
        {
          !filterUrl &&
            <>
            <div className='app__title'>
              <Title title='Promotions'/>
              <CustomButton
                containerStyles='app__btn_green'
                title='Create New Promotion'
                btnType='button'
                handleClick={handleAdd}
              />
            </div>

            {/* Filters */}
            <div className='app__filters'>
              <Filters
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
            </>
        }

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                  <tr>
                      <th className="hidden md:table-cell app__th pl-4"></th>
                      <th className="hidden md:table-cell app__th">
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Employee Name
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Position
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Effectivity Date
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Status
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: PromotionTypes) => (
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
                        <CustomButton
                            btnType='button'
                            title='Details'
                            handleClick={() => handleViewDetails(item)}
                            containerStyles="app__btn_green"
                          />
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div><span className='app_td_mobile_label'>Position:</span> <span>{item.hrm_item?.hrm_position?.name}</span></div>
                            <div><span className='app_td_mobile_label'>Effectivity Date:</span> <span>{format(new Date(item.effectivity_date), 'MMMM dd, yyyy')}</span></div>
                            <div>
                              {item.status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                              {item.status === 'For Verification' && <span className='app__status_container_orange'>For Verification</span>}
                              {item.status === 'For Final Approval' && <span className='app__status_container_orange'>For Final Approval</span>}
                              {item.status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                            </div>
                            <div>
                              <CustomButton
                                btnType='button'
                                title='Details'
                                handleClick={() => handleViewDetails(item)}
                                containerStyles="app__btn_green"
                              />
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>

                      <td
                        className="hidden md:table-cell app__td">
                        <div>
                          <UserBlock user={item.hrm_user}/>
                        </div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        {
                          item.hrm_item?.hrm_position?.name
                        }
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {format(new Date(item.effectivity_date), 'MMMM dd, yyyy')}
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {item.status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                          {item.status === 'For Verification' && <span className='app__status_container_orange'>For Verification</span>}
                          {item.status === 'For Final Approval' && <span className='app__status_container_blue'>For Final Approval</span>}
                          {item.status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
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
    {/* Delete Modal */}
    {
      showDeleteModal && (
        <DeleteModal
          id={selectedId}
          table='hrm_promotions'
          hideModal={() => setShowDeleteModal(false)}/>
      )
    }
    {/* Details Modal */}
    {
      (showDetailsModal && selectedItem) && (
        <DetailsModal
          promotionData={selectedItem}
          hideModal={() => setShowDetailsModal(false)}/>
      )
    }
  </>
  )
}
export default Page
