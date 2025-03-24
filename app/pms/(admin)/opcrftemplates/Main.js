'use client'
import DeleteModal from '@/components/DeleteModal'
import Header from '@/components/Headers/Header'
import TopBar from '@/components/Headers/TopBar'
import TableRowLoading from '@/components/Loading/TableRowLoading'
import Pagination from '@/components/Pagination'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Sidebar from '@/components/Sidebars/Sidebar'
import { useSupabase } from '@/components/supabase-provider'
import Unauthorized from '@/components/Unauthorized'
import { useFilter } from '@/context/FilterContext'
import { fullTextQuery } from '@/utils/text-helper'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon } from '@heroicons/react/20/solid'
import {
  ArchiveBoxArrowDownIcon,
  ArchiveBoxIcon,
  ArrowLeftIcon,
  EyeIcon,
  PencilSquareIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid'
import React, { Fragment, useEffect, useState } from 'react'
import uuid from 'react-uuid'
import AddEditModal from './AddEditModal'
import Filters from './Filters'
import PublishModal from './PublishModal'
import UnPublishedModal from './UnPublishedModal'

export default function Main({
  preFetchedData,
  count,
  kras,
  objectives,
  competencies,
  positions
}) {
  const { filters, setFilters, setToast, hasAccess, perPage, setPerPage } =
    useFilter()

  if (!hasAccess('pms_manager')) return <Unauthorized />

  const { supabase } = useSupabase()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showUnpublishedModal, setShowUnpublishedModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitFilter, setSubmitFilter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState(null)
  const [totalResults, setTotalResults] = useState(count)
  const [list, setList] = useState(preFetchedData)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    let query = supabase.from('opcrf_templates').select()

    // Full text search
    if (typeof filters.searchOpcrfTemplate !== 'undefined') {
      const searchQuery = fullTextQuery(filters.searchOpcrfTemplate)
      query = query.textSearch('title', searchQuery)
    }

    // View Archive
    if (typeof filters.achivedOpcrfTemplates !== 'undefined') {
      query = query.eq('is_archive', 'true')
    } else {
      query = query.neq('is_archive', 'true')
    }

    const from = (Number(currentPage) - 1) * Number(perPage)
    const to = from + (Number(perPage) - 1)

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

  const handleClearFilters = () => {
    if (loading) return // Return if status is still loading..
    setFilters({})
    setCurrentPage(1)
    setSubmitFilter(!submitFilter)
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

  const handleEdit = (item, viewMode) => {
    setShowAddModal(true)
    setEditData(item)
    if (viewMode === 'true') {
      setViewMode(true)
    } else {
      setViewMode(false)
    }
  }

  const handleDelete = (id) => {
    setShowDeleteModal(true)
    setSelectedId(id)
  }

  const handleUnpublished = (id) => {
    setShowUnpublishedModal(true)
    setSelectedId(id)
  }

  const handlePublish = (id) => {
    setShowPublishModal(true)
    setSelectedId(id)
  }

  const handleMoveArchive = async (id) => {
    const { error } = await supabase
      .from('opcrf_templates')
      .update({ is_archive: 'true' })
      .eq('id', id)

    if (error) console.error(error)

    // Remove from list
    handleRemoveFromList(id)

    // success message
    setToast('success', 'Successfully moved to archived')
  }
  const handleRemoveArchive = async (id) => {
    const { error } = await supabase
      .from('opcrf_templates')
      .update({ is_archive: '' })
      .eq('id', id)

    if (error) console.error(error)

    // Remove from list
    handleRemoveFromList(id)

    // success message
    setToast('success', 'Successfully removed from archived')
  }

  const handleViewArchive = (view) => {
    if (loading) return // Return if status is still loading..
    setFilters({ ...filters, ...{ achivedOpcrfTemplates: view || undefined } })
    setCurrentPage(1)
    setSubmitFilter(!submitFilter)
  }

  const handleSubmitFilter = () => {
    if (loading) return // Return if status is still loading..
    setCurrentPage(1)
    setSubmitFilter(!submitFilter)
  }

  const handleUpdateList = (updatedData) => {
    const items = list
    const foundIndex = items.findIndex((x) => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }

    setList(items)
  }

  const handleInsertToList = (newData) => {
    setList([newData, ...list])
  }

  const handleRemoveFromList = (id) => {
    setList((prevList) => prevList.filter((item) => item.id !== id))
  }

  const handleChangePage = (data) => {
    if (loading) return // Return if status is still loading..
    setCurrentPage(data)
    setSubmitFilter(!submitFilter)
  }

  useEffect(() => {
    if (submitFilter !== null) fetchData() // Prevent fetch on first load
    if (submitFilter === null) setPerPage(10) // Reset per page on first load
  }, [submitFilter])

  return (
    <>
      <Sidebar>
        <PmsSideBar />
      </Sidebar>
      <div className="lg:ml-64 pb-20 dark:bg-gray-900">
        <div>
          {/* Header */}
          <TopBar />
          <div className="flex items-center space-x-2 mx-4 py-2 border-b border-gray-200 dark:border-gray-500">
            <Header
              title={`OPCRF Templates ${
                typeof filters.achivedOpcrfTemplates !== 'undefined'
                  ? ' - Archives'
                  : ''
              }`}
            />
            {typeof filters.achivedOpcrfTemplates !== 'undefined' ? (
              <button
                onClick={() => handleViewArchive(false)}
                className="bg-gray-500 hover:bg-gray-600 border border-gray-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleViewArchive(true)}
                  className="bg-gray-500 hover:bg-gray-600 border border-gray-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                >
                  VIEW ARCHIVES
                </button>
                <button
                  onClick={handleAdd}
                  className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                >
                  ADD NEW TEMPLATE
                </button>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="mx-4 py-4 space-x-2 space-y-1">
            <Filters
              handleSubmitFilter={handleSubmitFilter}
              handleClearFilters={handleClearFilters}
            />
          </div>

          <div className="flex items-center py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-400">
            <div className="flex-1 text-xs">
              Showing {perPage} of {totalResults} results
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span>Results per page: </span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(e)}
                className="py-1 border border-gray-300 rounded-md"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
              <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="py-2 pl-4"></th>
                  <th className="py-2 px-2">Title</th>
                  <th className="hidden md:table-cell py-2 px-2">Status</th>
                  <th className="hidden md:table-cell py-2 px-2">
                    Total Weight
                  </th>
                  <th className="hidden md:table-cell py-2 px-2">
                    Total Objectives
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableRowLoading cols={6} rows={10} />
                ) : (
                  list?.map((item) => (
                    <tr
                      key={uuid()}
                      className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600"
                    >
                      <td className="w-6 py-2 pl-4">
                        <Menu
                          as="div"
                          className="relative inline-block text-left mr-2"
                        >
                          <div>
                            <Menu.Button className="inline-flex w-full justify-center focus:outline-none focus:ring-0">
                              <ChevronDownIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
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
                                {item.is_archive !== 'true' && (
                                  <Menu.Item>
                                    <div
                                      href="#"
                                      onClick={() =>
                                        handleEdit(item, item.is_published)
                                      }
                                      className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                                    >
                                      {item.is_published !== 'true' ? (
                                        <PencilSquareIcon className="w-4 h-4" />
                                      ) : (
                                        <EyeIcon className="w-4 h-4" />
                                      )}
                                      <span>
                                        {item.is_published !== 'true'
                                          ? 'Edit'
                                          : 'View Details'}
                                      </span>
                                    </div>
                                  </Menu.Item>
                                )}
                                {item.is_archive !== 'true' &&
                                  (item.is_published === 'true' ? (
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleUnpublished(item.id)
                                        }
                                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                      >
                                        <ArchiveBoxIcon className="w-4 h-4" />
                                        <span>Unpublished</span>
                                      </div>
                                    </Menu.Item>
                                  ) : (
                                    <Menu.Item>
                                      <div
                                        onClick={() => handlePublish(item.id)}
                                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                      >
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <span>Publish</span>
                                      </div>
                                    </Menu.Item>
                                  ))}
                                {item.is_archive === 'true' &&
                                typeof filters.achivedOpcrfTemplates !==
                                  'undefined' ? (
                                  <Menu.Item>
                                    <div
                                      onClick={() =>
                                        handleRemoveArchive(item.id)
                                      }
                                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                    >
                                      <ArchiveBoxIcon className="w-4 h-4" />
                                      <span>Unarchived</span>
                                    </div>
                                  </Menu.Item>
                                ) : (
                                  <Menu.Item>
                                    <div
                                      onClick={() => handleMoveArchive(item.id)}
                                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                    >
                                      <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                                      <span>Move to Archived</span>
                                    </div>
                                  </Menu.Item>
                                )}
                                <Menu.Item>
                                  <div
                                    onClick={() => handleDelete(item.id)}
                                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Delete</span>
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="py-2 px-2 text-gray-900 dark:text-white">
                        <div className="font-semibold">{item.title}</div>

                        {/* Mobile View */}
                        <div className="cursor-pointer">
                          <div className="md:hidden py-2">
                            {item.objectives?.length}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.is_published === 'true' && (
                          <div className="font-semibold inline-block bg-green-200 text-green-900 border border-green-500 mt-2 rounded-sm px-1 py-px text-xs">
                            Published
                          </div>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.objectives?.reduce(
                          (partialSum, item) =>
                            partialSum + Number(item.weight),
                          0
                        )}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.objectives?.length}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginaton */}
          <Pagination
            handleChangePage={handleChangePage}
            currentPage={currentPage}
            totalResults={totalResults}
            perPage={perPage}
          />

          {/* Add/Edit Modal */}
          {showAddModal && (
            <AddEditModal
              list={list}
              positions={positions}
              kras={kras}
              objectives={objectives}
              competencies={competencies}
              viewMode={viewMode}
              handleUpdateList={handleUpdateList}
              handleInsertToList={handleInsertToList}
              editData={editData}
              hideModal={(e) => setShowAddModal(false)}
            />
          )}

          {/* Confirm Delete Modal */}
          {showDeleteModal && (
            <DeleteModal
              table="opcrf_templates"
              handleRemoveFromList={handleRemoveFromList}
              selectedId={selectedId}
              hideModal={(e) => setShowDeleteModal(false)}
            />
          )}

          {/* Confirm Publish Modal */}
          {showPublishModal && (
            <PublishModal
              handleUpdateList={handleUpdateList}
              selectedId={selectedId}
              hideModal={(e) => setShowPublishModal(false)}
            />
          )}
          {/* Confirm UnPublished Modal */}
          {showUnpublishedModal && (
            <UnPublishedModal
              handleUpdateList={handleUpdateList}
              selectedId={selectedId}
              hideModal={(e) => setShowUnpublishedModal(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
