'use client'
import { PerPage, ShowMore, Sidebar, Title, TopBar } from '@/components'
import DeleteModal from '@/components/DeleteModal'
import TableRowLoading from '@/components/Loading/TableRowLoading'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { Office, SchoolTypes } from '@/types'
import {
  IpcrfTemplateTypes,
  IpcrfTypes,
  KraObjectiveTypes
} from '@/types/pmsTypes'
import { fetchIpcrfs } from '@/utils/pmsApi'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'react-uuid'
import AddEditModal from './AddEditModal'
import CompetenciesRatingsModal from './CompetenciesRatingsModal'
import DevelopmentPlanModal from './DevelopmentPlanModal'
import RatingsModal from './RatingsModal'

interface ModalProps {
  objectivesData: KraObjectiveTypes[]
  // competencies: CompetencyTypes[]
  ipcrfTemplates: IpcrfTemplateTypes[]
}

export default function Main({
  objectivesData,
  // competencies,
  ipcrfTemplates
}: ModalProps) {
  const { hasAccess, setToast } = useFilter()

  const {
    systemSchools,
    systemOffices,
    session,
    supabase
  }: {
    systemSchools: SchoolTypes[]
    systemOffices: Office[]
    supabase: any
    session: any
  } = useSupabase()

  const [saving, setSaving] = useState(false)
  const [showDevelopmentPlanModal, setShowDevelopmentPlanModal] =
    useState(false)
  // filters
  const [view, setView] = useState('my_ipcrf')
  const [viewMode, setViewMode] = useState(false)
  // modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showCompetencyRatingModal, setShowCompetencyRatingModal] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState<IpcrfTypes | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [list, setList] = useState<IpcrfTypes[]>([])

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchIpcrfs(
        {
          userId: session.user.id,
          view
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
      const result = await fetchIpcrfs(
        {
          userId: session.user.id,
          view
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
  }

  const handleEdit = (item: IpcrfTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }

  const handleEditRating = (item: IpcrfTypes) => {
    setShowRatingModal(true)
    setSelectedId(item.id)
    setEditData(item)
  }

  const handleEditCompetencyRating = (item: IpcrfTypes) => {
    setShowCompetencyRatingModal(true)
    setSelectedId(item.id)
    setEditData(item)
  }

  const handleEditDevelopmentPlan = (item: IpcrfTypes) => {
    setShowDevelopmentPlanModal(true)
    setSelectedId(item.id)
    setEditData(item)

    if (
      view === 'as_approver' ||
      view === 'as_rater' ||
      item.status === 'Approved'
    ) {
      setViewMode(true)
    } else {
      setViewMode(false)
    }
  }

  const handleDelete = (id: string) => {
    setShowDeleteModal(true)
    setSelectedId(id)
  }

  const handleApprove = async (id: string) => {
    setSaving(true)

    const { error } = await supabase
      .from('ipcrfs')
      .update({
        status: 'Approved'
      })
      .eq('id', id)

    if (!error) {
      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        status: 'Approved',
        id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
    }
  }

  const handleUnapprove = async (id: string) => {
    setSaving(true)

    const { error } = await supabase
      .from('ipcrfs')
      .update({
        status: 'Pending Approval'
      })
      .eq('id', id)

    if (!error) {
      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        status: 'Pending Approval',
        id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)
    }
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
  }, [perPageCount, view])

  const isHead =
    systemSchools.find((school) => school.head_user_id === session.user.id) ??
    systemOffices.find((office) => office.head_user_id === session.user.id)
      ? true
      : false

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
            <Title title="IPCRFs" />
            {!isHead && (
              <button
                onClick={handleAdd}
                className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
              >
                CREATE NEW IPCRF
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-500">
            <div className="flex items-center space-x-2 mx-4 py-2">
              <button
                type="button"
                onClick={() => setView('my_ipcrf')}
                className={`${
                  view === 'my_ipcrf' ? 'bg-emerald-500' : 'bg-gray-500'
                } font-medium px-2 py-1 text-xs text-white rounded-sm`}
              >
                My IPCRF
              </button>
              <button
                type="button"
                onClick={() => setView('as_rater')}
                className={`${
                  view === 'as_rater' ? 'bg-emerald-500' : 'bg-gray-500'
                } font-medium px-2 py-1 text-xs text-white rounded-sm`}
              >
                As Rater
              </button>
              {hasAccess('sds') && (
                <button
                  type="button"
                  onClick={() => setView('as_approver')}
                  className={`${
                    view === 'as_approver' ? 'bg-emerald-500' : 'bg-gray-500'
                  } font-medium px-2 py-1 text-xs text-white rounded-sm`}
                >
                  As Approver
                </button>
              )}
            </div>
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          <div className="border-t border-gray-200 dark:border-gray-500">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
              <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="hidden md:table-cell py-2 pl-4"></th>
                  <th className="hidden md:table-cell py-2 px-2">IPCRF</th>
                  <th className="hidden md:table-cell py-2 px-2">Status</th>
                  <th className="hidden md:table-cell py-2 px-2">Rater</th>
                  <th className="hidden md:table-cell py-2 px-2">
                    IPCRF Rating
                  </th>
                  <th className="hidden md:table-cell py-2 px-2">Actions</th>
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
                            <Menu.Items className="absolute left-0 z-50 mt-2 w-auto origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                {view === 'my_ipcrf' &&
                                  item.status !== 'Approved' && (
                                    <Menu.Item>
                                      <div
                                        onClick={() => handleEdit(item)}
                                        className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        <span>Edit Rater</span>
                                      </div>
                                    </Menu.Item>
                                  )}
                                <Menu.Item>
                                  <div
                                    onClick={() => handleEditRating(item)}
                                    className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>IPCRF&nbsp;Ratings</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                    onClick={() =>
                                      handleEditCompetencyRating(item)
                                    }
                                    className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Competencies&nbsp;Ratings</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                    onClick={() =>
                                      handleEditDevelopmentPlan(item)
                                    }
                                    className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Development Plan</span>
                                  </div>
                                </Menu.Item>
                                {view === 'my_ipcrf' &&
                                  item.status !== 'Approved' && (
                                    <Menu.Item>
                                      <div
                                        onClick={() => handleDelete(item.id)}
                                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                        <span>Delete</span>
                                      </div>
                                    </Menu.Item>
                                  )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="py-2 px-2 text-gray-900 dark:text-white">
                        <div className="font-semibold">
                          {item.ipcrf_template.title}
                        </div>

                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden py-2">
                            <span className="font-light">Rater: </span>
                            <span className="font-semibold">
                              {item.rater.firstname} {item.rater.middlename}{' '}
                              {item.rater.lastname}
                            </span>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell py-2 px-2">
                        <span
                          className={`${
                            item.status === 'Approved'
                              ? 'font-bold text-emerald-700'
                              : 'font-bold text-orange-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.rater.firstname} {item.rater.middlename}{' '}
                        {item.rater.lastname}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {item.score && (
                          <div>
                            <span className="font-bold text-emerald-700">
                              {item.score}
                            </span>
                            <span> | </span>
                            <span className="font-bold text-emerald-700">
                              {item.adjectival_rating}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-2 px-2">
                        {view === 'as_approver' &&
                          item.status !== 'Approved' &&
                          item.status === 'For Approval' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(item.id)}
                              disabled={saving}
                              className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                            >
                              {saving ? 'Approving..' : 'Approve'}
                            </button>
                          )}
                        {view === 'as_approver' &&
                          item.status === 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleUnapprove(item.id)}
                              disabled={saving}
                              className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                            >
                              {saving
                                ? 'Updating..'
                                : 'Change Status to "Pending"'}
                            </button>
                          )}
                      </td>
                    </tr>
                  ))
                )}
                {list?.length === 0 && !loading && (
                  <tr>
                    <td className="py-2 px-2">No records found.</td>
                  </tr>
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
              list={list}
              ipcrfTemplates={ipcrfTemplates}
              editData={editData}
              hideModal={() => setShowAddModal(false)}
            />
          )}
          {/* Rating Modal */}
          {showRatingModal && editData && (
            <RatingsModal
              ipcrfId={selectedId}
              allObjectives={objectivesData}
              editData={editData}
              view={view}
              hideRatingModal={() => setShowRatingModal(false)}
            />
          )}
          {/* Competencies Rating Modal */}
          {showCompetencyRatingModal && editData && (
            <CompetenciesRatingsModal
              ipcrfId={selectedId}
              editData={editData}
              view={view}
              hideRatingModal={() => setShowCompetencyRatingModal(false)}
            />
          )}
          {/* Development Plan Modal */}
          {showDevelopmentPlanModal && (
            <DevelopmentPlanModal
              ipcrfId={selectedId}
              viewMode={viewMode}
              hideModal={() => setShowDevelopmentPlanModal(false)}
            />
          )}
          {/* Confirm Delete Modal */}
          {showDeleteModal && (
            <DeleteModal
              table="ipcrfs"
              id={selectedId}
              hideModal={() => setShowDeleteModal(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
