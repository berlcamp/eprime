'use client'
import { PerPage, ShowMore, Sidebar, Title, TopBar } from '@/components'
import DeleteModal from '@/components/DeleteModal'
import TableRowLoading from '@/components/Loading/TableRowLoading'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Unauthorized from '@/components/Unauthorized'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { PositionTypes } from '@/types'
import {
  CompetencyTypes,
  IpcrfTemplateTypes,
  KraObjectiveTypes,
  KraTypes
} from '@/types/pmsTypes'
import { fetchIpcrfTemplates } from '@/utils/pmsApi'
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
import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'react-uuid'
import AddEditModal from './AddEditModal'
import Filters from './Filters'
import PublishModal from './PublishModal'
import UnPublishedModal from './UnPublishedModal'

interface MainProps {
  kras: KraTypes[]
  objectives: KraObjectiveTypes[]
  competencies: CompetencyTypes[]
  positions: PositionTypes[]
}

export default function Main({
  kras,
  objectives,
  competencies,
  positions
}: MainProps) {
  const { setToast, hasAccess } = useFilter()

  const { supabase } = useSupabase()
  // filters
  const [filterKeyword, setFilterKeyword] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  // modals
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showUnpublishedModal, setShowUnpublishedModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [selectedItem, setSelectedItem] = useState<IpcrfTemplateTypes | null>(
    null
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState<IpcrfTemplateTypes | null>(null)
  const [list, setList] = useState<IpcrfTemplateTypes[]>([])
  const [viewMode, setViewMode] = useState(false)

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchIpcrfTemplates(
        {
          filterKeyword,
          showArchive
        },
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
      const result = await fetchIpcrfTemplates(
        {
          filterKeyword,
          showArchive
        },
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

  const handleAdd = () => {
    setShowAddModal(true)
    setEditData(null)
    setViewMode(false)
  }

  const handleEdit = (item: IpcrfTemplateTypes, isPublished: boolean) => {
    setShowAddModal(true)
    setEditData(item)
    if (isPublished) {
      setViewMode(true)
    } else {
      setViewMode(false)
    }
  }

  const handleDelete = (id: string) => {
    setShowDeleteModal(true)
    setSelectedId(id)
  }

  const handleUnpublished = (id: string) => {
    setShowUnpublishedModal(true)
    setSelectedId(id)
  }

  const handlePublish = (item: IpcrfTemplateTypes) => {
    setShowPublishModal(true)
    setSelectedItem(item)
  }

  const handleMoveArchive = async (id: string) => {
    const { error } = await supabase
      .from('ipcrf_templates')
      .update({ is_archive: true })
      .eq('id', id)

    if (error) console.error(error)

    // Remove from list in redux
    const items = [...globallist]
    const updatedList = items.filter((item) => item.id !== id)
    dispatch(updateList(updatedList))

    // Updating showing text in redux
    dispatch(
      updateResultCounter({
        showing: Number(resultsCounter.showing) - 1,
        results: Number(resultsCounter.results) - 1
      })
    )

    // success message
    setToast('success', 'Successfully moved to archived')
  }
  const handleRemoveArchive = async (id: string) => {
    const { error } = await supabase
      .from('ipcrf_templates')
      .update({ is_archive: false })
      .eq('id', id)

    if (error) console.error(error)

    // Remove from list in redux
    const items = [...globallist]
    const updatedList = items.filter((item) => item.id !== id)
    dispatch(updateList(updatedList))

    // Updating showing text in redux
    dispatch(
      updateResultCounter({
        showing: Number(resultsCounter.showing) - 1,
        results: Number(resultsCounter.results) - 1
      })
    )

    // success message
    setToast('success', 'Successfully removed from archived')
  }

  const getPositionName = (id: string) => {
    const obj = positions.filter((item) => item.id.toString() === id)
    return obj.length > 0 ? obj[0].name : null
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
  }, [perPageCount, showArchive, filterKeyword])

  if (!hasAccess('pms_manager')) return <Unauthorized />

  return (
    <>
      <Sidebar>
        <PmsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          {/* Header */}
          <div className="app__title">
            <Title
              title={`IPCRF Templates ${showArchive ? ' - Archives' : ''}`}
            />
            {showArchive ? (
              <button
                onClick={() => setShowArchive(false)}
                className="bg-gray-500 hover:bg-gray-600 border border-gray-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowArchive(true)}
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
          <div className="app__filters">
            <Filters setFilterKeyword={setFilterKeyword} />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

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
                  <th className="hidden md:table-cell py-2 px-2">
                    Core Behavioral Competencies
                  </th>
                  <th className="hidden md:table-cell py-2 px-2">Positions</th>
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
                                {!item.is_archive && (
                                  <>
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleEdit(item, item.is_published)
                                        }
                                        className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                                      >
                                        {item.is_published ? (
                                          <PencilSquareIcon className="w-4 h-4" />
                                        ) : (
                                          <EyeIcon className="w-4 h-4" />
                                        )}
                                        <span>
                                          {!item.is_published
                                            ? 'Edit'
                                            : 'View Details'}
                                        </span>
                                      </div>
                                    </Menu.Item>
                                    {item.is_published ? (
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
                                          onClick={() => handlePublish(item)}
                                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                        >
                                          <ShieldCheckIcon className="w-4 h-4" />
                                          <span>Publish</span>
                                        </div>
                                      </Menu.Item>
                                    )}
                                  </>
                                )}
                                {item.is_archive ? (
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
                            {item.positions?.map((item) => (
                              <div
                                key={uuid()}
                                className="inline-flex font-semibold bg-green-100 text-green-900 border border-green-500 mt-2 rounded-sm px-1 m-1 py-px text-xs"
                              >
                                {getPositionName(item.id)}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.is_published && (
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
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.competencies?.length}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.positions?.map((item) => (
                          <div
                            key={uuid()}
                            className="inline-flex font-semibold bg-green-100 text-green-900 border border-green-500 mt-2 rounded-sm px-1 m-1 py-px text-xs"
                          >
                            {item.name}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}

          {/* Add/Edit Modal */}
          {showAddModal && (
            <AddEditModal
              positions={positions}
              kras={kras}
              objectives={objectives}
              competencies={competencies}
              viewMode={viewMode}
              editData={editData}
              hideModal={() => setShowAddModal(false)}
            />
          )}

          {/* Confirm Delete Modal */}
          {showDeleteModal && (
            <DeleteModal
              table="ipcrf_templates"
              id={selectedId}
              hideModal={() => setShowDeleteModal(false)}
            />
          )}

          {/* Confirm Publish Modal */}
          {showPublishModal && selectedItem && (
            <PublishModal
              selectedItem={selectedItem}
              hideModal={() => setShowPublishModal(false)}
            />
          )}
          {/* Confirm UnPublished Modal */}
          {showUnpublishedModal && selectedItem && (
            <UnPublishedModal
              selectedItem={selectedItem}
              hideModal={() => setShowUnpublishedModal(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
