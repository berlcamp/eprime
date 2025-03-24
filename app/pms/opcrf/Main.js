'use client'
import Header from '@/components/Headers/Header'
import TopBar from '@/components/Headers/TopBar'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Sidebar from '@/components/Sidebars/Sidebar'
import { useSupabase } from '@/components/supabase-provider'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useEffect, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import uuid from 'react-uuid'
import AddEditModal from './AddEditModal'
import TableRowLoading from '@/components/Loading/TableRowLoading'
import DeleteModal from '@/components/DeleteModal'
import RatingsModal from './RatingsModal'
import { useFilter } from '@/context/FilterContext'
import Pagination from '@/components/Pagination'
import DevelopmentPlanModal from './DevelopmentPlanModal'

export default function Main ({ preFetchedData, objectivesData, competencies, opcrfTemplates }) {
  const { hasAccess, setToast, perPage, isSchoolHead, setPerPage } = useFilter()
  const { supabase, session } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDevelopmentPlanModal, setShowDevelopmentPlanModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [submitFilter, setSubmitFilter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('my_opcrf')
  const [editData, setEditData] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [list, setList] = useState(preFetchedData)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  const fetchData = async () => {
    setLoading(true)

    let query = supabase
      .from('opcrfs')
      .select(`*,
                opcrf_templates (title),
                rater:rater_user_id(id,firstname,lastname,middlename)
              `, { count: 'exact' })

    if (view === 'my_opcrf') {
      query = query.eq('user_id', session.user.id)
    }
    if (view === 'as_rater') {
      query = query.eq('rater_user_id', session.user.id)
    }

    const from = (Number(currentPage) - 1) * Number(perPage)
    const to = from + (Number(perPage) - 1)

    // Per Page from context
    query = query.range(from, to)

    // Order By
    query = query.order('id', { ascending: false })

    const { data, count, error } = await query

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
  }

  const handleEdit = (item) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleEditRating = (item) => {
    setShowRatingModal(true)
    setSelectedId(item.id)
    setEditData(item)
  }

  const handleUpdateList = (updatedData) => {
    const items = list
    const foundIndex = items.findIndex(x => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    setList(items)
  }

  const handleInsertToList = (newData) => {
    setList([newData, ...list])
  }

  const handleDelete = (id) => {
    setShowDeleteModal(true)
    setSelectedId(id)
  }

  const handleRemoveFromList = (id) => {
    const temp = list.filter(item => item.id !== id)
    setList(temp)
  }

  const handleChangeView = (v) => {
    if (v !== view) {
      setView(v)
      setSubmitFilter(!submitFilter)
    }
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

  const handleChangePage = (data) => {
    if (loading) return // Return if status is still loading..
    setCurrentPage(data)
    setSubmitFilter(!submitFilter)
  }

  const handleApprove = async (id) => {
    setSaving(true)

    const { error } = await supabase
      .from('opcrfs')
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
      .from('opcrfs')
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
    fetchData() // Prevent fetch on first load
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
              {
                isSchoolHead &&
                  <button
                    onClick={handleAdd}
                    className='bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm'>
                      CREATE NEW OPCRF
                  </button>
              }
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
                <button
                  type="button"
                  onClick={() => handleChangeView('as_rater')}
                  className={`${view === 'as_rater' ? 'bg-emerald-500' : 'bg-gray-500'} font-medium px-2 py-1 text-xs text-white rounded-sm`}
                >
                  As Rater
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

            <div className='border-t border-gray-200 dark:border-gray-500'>
              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="hidden md:table-cell py-2 pl-4"></th>
                        <th className="hidden md:table-cell py-2 px-2">
                            OPCRF
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Status
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            OPCRF Rating
                        </th>
                        <th className="hidden md:table-cell py-2 px-2">
                            Score
                        </th>
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
                                                  <span>Edit Rater</span>
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
                                                  onClick={ () => handleDelete(item.id) }
                                                  className='flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs'
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
                                <div className="font-semibold">{item.opcrf_templates.title}</div>

                                {/* Mobile View */}
                                <div>
                                  <div className="md:hidden py-2">
                                    <span className='font-light'>Rater: </span>
                                    <span className='font-semibold'>{item.rater.firstname} {item.rater.middlename} {item.rater.lastname}</span>
                                  </div>
                                </div>
                                {/* End - Mobile View */}

                              </th>
                              <td className="hidden md:table-cell py-2 px-2">
                                <span className={`${item.status === 'Approved' ? 'font-bold text-emerald-700' : 'font-bold text-orange-600'}`}>{item.status}</span>
                              </td>
                              <td className="hidden md:table-cell py-2 px-2">
                                {item.rater.firstname} {item.rater.middlename} {item.rater.lastname}
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
                  {
                    (list?.length === 0 && !loading) &&
                      <tr>
                        <td className='py-2 px-2'>No records found.</td>
                      </tr>
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
                  handleInsertToList={handleInsertToList}
                  handleUpdateList={handleUpdateList}
                  opcrfTemplates={opcrfTemplates}
                  editData={editData}
                  hideModal={e => setShowAddModal(false)}/>
              )
            }
            {/* Rating Modal */}
            {
              showRatingModal && (
                <RatingsModal
                  opcrfId={selectedId}
                  allObjectives={objectivesData}
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
                  table='opcrfs'
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
