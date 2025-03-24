'use client'
import Header from '@/components/Headers/Header'
import TopBar from '@/components/Headers/TopBar'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Sidebar from '@/components/Sidebars/Sidebar'
import { useSupabase } from '@/components/supabase-provider'
import { PencilSquareIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon } from '@heroicons/react/20/solid'
import uuid from 'react-uuid'
import AddEditModal from './AddEditModal'
import { useFilter } from '@/context/FilterContext'
import Pagination from '@/components/Pagination'
import DeleteModal from '@/components/DeleteModal'
import TableRowLoading from '@/components/Loading/TableRowLoading'
import Unauthorized from '@/components/Unauthorized'
import RatingsModal from './RatingsModal'
import DevelopmentPlanModal from './DevelopmentPlanModal'

export default function Main ({ preFetchedData, count }) {
  const { hasAccess, setToast, perPage, setPerPage } = useFilter()

  if (!hasAccess('sds') && !hasAccess('cid') && !hasAccess('sgod')) return <Unauthorized/>

  const { supabase, session } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showDevelopmentPlanModal, setShowDevelopmentPlanModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitFilter, setSubmitFilter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState(null)
  const [totalResults, setTotalResults] = useState(count)
  const [list, setList] = useState(preFetchedData)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState(false)
  const [view, setView] = useState('my_opcrf')

  const fetchData = async () => {
    setLoading(true)

    let query = supabase
      .from('chiefs_opcrf')
      .select()

    const from = (Number(currentPage) - 1) * Number(perPage)
    const to = from + (Number(perPage) - 1)

    if (view === 'my_opcrf') {
      query = query.eq('user_id', session.user.id)
    }

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { count, data, error } = await query

    if (error) console.error(error)

    setLoading(false)
    setList(data)
    setTotalResults(count)
  }

  const handlePerPageChange = (e) => {
    if (loading) return // Return if status is still loading..
    setPerPage(e.target.value)
    setCurrentPage(1)
    setSubmitFilter(!submitFilter)
  }

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
    setViewMode(false)
  }

  const handleEdit = (item) => {
    console.log(item)
    setShowAddModal(true)
    setEditData(item)
  }

  const handleDelete = (id) => {
    setShowDeleteModal(true)
    setSelectedId(id)
  }

  const handleUpdateList = (updatedData) => {
    const items = list
    const foundIndex = items.findIndex(x => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    setList(items)
  }

  const handleEditRating = (item) => {
    setShowRatingModal(true)
    setSelectedId(item.id)
    setEditData(item)
  }

  const handleInsertToList = (newData) => {
    setList([newData, ...list])
  }

  const handleRemoveFromList = (id) => {
    setList(prevList => prevList.filter(item => item.id !== id))
  }

  const handleChangePage = (data) => {
    if (loading) return // Return if status is still loading..
    setCurrentPage(data)
    setSubmitFilter(!submitFilter)
  }

  const handleEditDevelopmentPlan = (item) => {
    setShowDevelopmentPlanModal(true)
    setSelectedId(item.id)
    setEditData(item)

    if (view === 'as_approver' || view === 'as_rater' || item.status === 'Approved') {
      setViewMode(true)
    } else {
      setViewMode(false)
    }
  }

  const handleChangeView = (v) => {
    if (v !== view) {
      setView(v)
      setSubmitFilter(!submitFilter)
    }
  }

  const handleApprove = async (id) => {
    setSaving(true)

    const { error } = await supabase
      .from('chiefs_opcrf')
      .update({
        status: 'Approved'
      })
      .eq('id', id)

    if (!error) {
      const updatedData = {
        status: 'Approved',
        id
      }
      handleUpdateList(updatedData) // Update list on main page

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
    }
  }

  const handleUnapprove = async (id) => {
    setSaving(true)

    const { error } = await supabase
      .from('chiefs_opcrf')
      .update({
        status: 'Pending Approval'
      })
      .eq('id', id)

    if (!error) {
      const updatedData = {
        status: 'Pending Approval',
        id
      }
      handleUpdateList(updatedData) // Update list on main page

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
    }
  }

  useEffect(() => {
    if (submitFilter !== null) fetchData() // Prevent fetch on first load
    if (submitFilter === null) setPerPage(10) // Reset per page on first load
  }, [submitFilter])

  return (
    <>
      <Sidebar>
        <PmsSideBar/>
      </Sidebar>
      <div className="lg:ml-64 pb-20 dark:bg-gray-900">
        <div>
            {/* Header */}
            <TopBar/>
            <div className='flex items-center space-x-2 mx-4 py-2'>
              <Header title='OPCRFs'/>
              <button
                onClick={handleAdd}
                className='bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm'>
                  ADD NEW OPCRF
              </button>
            </div>

            <div className='border-t border-gray-200 dark:border-gray-500'>
              <div className='flex items-center space-x-2 mx-4 py-2'>
                <button
                  type="button"
                  onClick={() => handleChangeView('my_opcrf')}
                  className={`${view === 'my_opcrf' ? 'bg-emerald-500' : 'bg-gray-500'} font-medium px-2 py-1 text-xs text-white rounded-sm`}
                >
                  My OPCRF
                </button>
                {
                  hasAccess('sds') &&
                    <button
                      type="button"
                      onClick={() => handleChangeView('as_approver')}
                      className={`${view === 'as_approver' ? 'bg-emerald-500' : 'bg-gray-500'} font-medium px-2 py-1 text-xs text-white rounded-sm`}
                    >
                      As Approver
                    </button>
                }
              </div>
            </div>

            <div className='flex items-center py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-400'>
              <div className='flex-1 text-xs'>Showing {perPage} of {totalResults} results</div>
              <div className='flex items-center space-x-2 text-xs'>
                <span>Results per page: </span>
                <select
                  value={perPage }
                  onChange={e => handlePerPageChange(e)}
                  className='py-1 border border-gray-300 rounded-md'>
                  <option value='10'>10</option>
                  <option value='20'>20</option>
                  <option value='50'>50</option>
                  <option value='100'>100</option>
                </select>
              </div>
            </div>

            <div className=''>
              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="py-2 pl-4"></th>
                        <th className="py-2 px-2">Title</th>
                        <th className="hidden md:table-cell py-2 px-2">Status</th>
                        <th className="hidden md:table-cell py-2 px-2">Total Weight</th>
                        <th className="hidden md:table-cell py-2 px-2">Total Objectives</th>
                        <th className="hidden md:table-cell py-2 px-2">OPCRF Rating</th>
                        <th className="hidden md:table-cell py-2 px-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                  {
                    loading
                      ? (
                          <TableRowLoading cols={6} rows={10}/>
                        )
                      : (
                          list?.map((item) => (
                            <tr
                              key={uuid()}
                              className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600">
                              <td
                                className="w-6 py-2 pl-4">
                                <Menu as="div" className="relative inline-block text-left mr-2">
                                  <div>
                                    <Menu.Button className="inline-flex w-full justify-center focus:outline-none focus:ring-0">
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
                                    <Menu.Items className="absolute left-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                      <div className="py-1">
                                        {
                                          (view === 'my_opcrf' && item.status !== 'Approved') &&
                                            <Menu.Item>
                                              <div
                                                  href="#"
                                                  onClick={() => handleEdit(item)}
                                                  className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                                                >
                                                  <PencilSquareIcon className='w-4 h-4'/>
                                                  <span>Edit</span>
                                                </div>
                                            </Menu.Item>
                                        }
                                        <Menu.Item>
                                          <div
                                              href="#"
                                              onClick={() => handleEditRating(item)}
                                              className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                                            >
                                              <PencilSquareIcon className='w-4 h-4'/>
                                              <span>OPCRF Ratings</span>
                                            </div>
                                        </Menu.Item>
                                        <Menu.Item>
                                          <div
                                              href="#"
                                              onClick={() => handleEditDevelopmentPlan(item)}
                                              className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                                            >
                                              <PencilSquareIcon className='w-4 h-4'/>
                                              <span>Development Plan</span>
                                            </div>
                                        </Menu.Item>
                                        {
                                          (view === 'my_opcrf' && item.status !== 'Approved') &&
                                            <Menu.Item>
                                              <div
                                                  href="#"
                                                  onClick={() => handleDelete(item.id)}
                                                  className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                                                >
                                                  <TrashIcon className='w-4 h-4'/>
                                                  <span>Delete</span>
                                                </div>
                                            </Menu.Item>
                                        }
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                              </td>
                              <th
                                className="py-2 px-2 text-gray-900 dark:text-white">
                                <div className="font-semibold">{item.title}</div>
                                {
                                  item.is_published === 'true' &&
                                    <div className="font-semibold inline-block bg-green-200 text-green-900 border border-green-500 mt-2 rounded-sm px-1 py-px text-xs">Published</div>
                                }

                                {/* Mobile View */}
                                <div
                                  className='cursor-pointer'>
                                  <div className="md:hidden py-2">
                                    {item.objectives?.length}
                                  </div>
                                  <div className="md:hidden py-2">
                                    {item.score &&
                                      <div>
                                        <span className='font-bold text-emerald-700'>{ item.score }</span>
                                        <span> | </span>
                                        <span className='font-bold text-emerald-700'>{item.adjectival_rating}</span>
                                      </div>
                                    }
                                  </div>
                                  <div className="md:hidden py-2">
                                    {item.objectives?.length}
                                  </div>
                                  <div className="md:hidden py-2">
                                    <span className={`${item.status === 'Approved' ? 'font-bold text-emerald-700' : 'font-bold text-orange-600'}`}>{item.status}</span>
                                  </div>
                                </div>
                                {/* End - Mobile View */}

                              </th>
                              <td className="hidden md:table-cell py-2 px-2">
                                <span className={`${item.status === 'Approved' ? 'font-bold text-emerald-700' : 'font-bold text-orange-600'}`}>{item.status}</span>
                              </td>
                              <td
                                className="hidden md:table-cell py-2 px-2">
                                  {item.objectives?.reduce((partialSum, item) => partialSum + Number(item.weight), 0)}
                              </td>
                              <td
                                className="hidden md:table-cell py-2 px-2">
                                  {item.objectives?.length}
                              </td>
                              <td className="hidden md:table-cell py-2 px-2">
                                {item.score &&
                                  <div>
                                    <span className='font-bold text-emerald-700'>{ item.score }</span>
                                    <span> | </span>
                                    <span className='font-bold text-emerald-700'>{item.adjectival_rating}</span>
                                  </div>
                                }
                              </td>
                              <td className="hidden md:table-cell py-2 px-2">
                                {
                                  (view === 'as_approver' && item.status !== 'Approved') &&
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(item.id)}
                                      disabled={saving}
                                      className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                                    >
                                      {saving ? 'Approving..' : 'Approve'}
                                    </button>
                                }
                                {
                                  (view === 'as_approver' && item.status === 'Approved') &&
                                    <button
                                      type="button"
                                      onClick={() => handleUnapprove(item.id)}
                                      disabled={saving}
                                      className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                                    >
                                      {saving ? 'Updating..' : 'Change Status to "Pending"'}
                                    </button>
                                }
                              </td>
                            </tr>
                          ))
                        )
                  }

                </tbody>
              </table>
            </div>

            {/* Paginaton */}
            <Pagination
              handleChangePage={handleChangePage}
              currentPage={currentPage}
              totalResults={totalResults}
              perPage={perPage}/>

            {/* Add/Edit Modal */}
            {
              showAddModal && (
                <AddEditModal
                  list={list}
                  viewMode={viewMode}
                  handleUpdateList={handleUpdateList}
                  handleInsertToList={handleInsertToList}
                  editData={editData}
                  hideModal={e => setShowAddModal(false)}/>
              )
            }
            {/* Rating Modal */}
            {
              showRatingModal && (
                <RatingsModal
                  opcrfId={selectedId}
                  editData={editData}
                  view={view}
                  handleUpdateList={handleUpdateList}
                  hideRatingModal={e => setShowRatingModal(false)}/>
              )
            }
            {/* Development Plan Modal */}
            {
              showDevelopmentPlanModal && (
                <DevelopmentPlanModal
                  opcrfId={selectedId}
                  viewMode={viewMode}
                  hideModal={e => setShowDevelopmentPlanModal(false)}/>
              )
            }
            {/* Confirm Delete Modal */}
            {
              showDeleteModal && (
                <DeleteModal
                  table='chiefs_opcrf'
                  handleRemoveFromList={handleRemoveFromList}
                  selectedId={selectedId}
                  hideModal={e => setShowDeleteModal(false)}/>
              )
            }
        </div>
      </div>
    </>
  )
}
