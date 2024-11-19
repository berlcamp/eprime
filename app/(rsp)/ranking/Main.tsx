'use client'

import {
  CustomButton,
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  UserBlock
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { fetchRankings } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
import AddEditModal from './AddEditModal'
import Filters from './Filters'

// Types
import type { RankingTypes } from '@/types'

// Redux imports
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { format } from 'date-fns'
import { TableIcon, User2Icon, UsersIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import RankingApplicants from './RankingApplicants'
import RankingCommittees from './RankingCommittees'
import RankingCriterias from './RankingCriterias'
import RankingEvaluators from './RankingEvaluators'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showApplicantsModal, setShowApplicantsModal] = useState(false)
  const [showCriteriasModal, setShowCriteriasModal] = useState(false)
  const [showCommitteesModal, setShowCommitteesModal] = useState(false)
  const [showEvaluatorsModal, setShowEvaluatorsModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [refetch, setRefetch] = useState(false)

  const [list, setList] = useState<RankingTypes[]>([])
  const [filterPosition, setFilterPosition] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)
  const [editData, setEditData] = useState<RankingTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { hasAccess } = useFilter()
  const { session } = useSupabase()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchRankings(
        {
          userId: hasAccess('rsp_manager') ? null : session.user.id,
          filterStatus,
          filterPosition
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
      const result = await fetchRankings(
        {
          userId: hasAccess('rsp_manager') ? null : session.user.id,
          filterStatus,
          filterPosition
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

  const handleEdit = (item: RankingTypes) => {
    setShowAddModal(true)
    setEditData(item)
  }
  const handleViewApplicants = (id: string) => {
    setShowApplicantsModal(true)
    setSelectedId(id)
  }

  const handleViewCriterias = (id: string) => {
    setShowCriteriasModal(true)
    setSelectedId(id)
  }

  const handleViewCommittees = (id: string) => {
    setShowCommitteesModal(true)
    setSelectedId(id)
  }

  const handleViewEvaluator = (id: string) => {
    setShowEvaluatorsModal(true)
    setSelectedId(id)
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
  }, [refetch, perPageCount, filterPosition, filterStatus])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Ranking" />
            {hasAccess('rsp_manager') && (
              <CustomButton
                containerStyles="app__btn_green"
                title="Create New Ranking"
                btnType="button"
                handleClick={handleAdd}
              />
            )}
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterStatus={setFilterStatus}
              setFilterPosition={setFilterPosition}
            />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="hidden md:table-cell app__th pl-4"></th>
                  <th className="hidden md:table-cell app__th">Position</th>
                  <th className="hidden md:table-cell app__th">Type</th>
                  <th className="hidden md:table-cell app__th">
                    Display On Website
                  </th>
                  <th className="hidden md:table-cell app__th">Chairman</th>
                  <th className="hidden md:table-cell app__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: RankingTypes, index) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td">
                        <Menu as="div" className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
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
                            <Menu.Items className="app__dropdown_items">
                              <div className="py-1">
                                {(hasAccess('rsp_manager') ||
                                  item.chairman_id === session.user.id) && (
                                  <>
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleViewCriterias(item.id)
                                        }
                                        className="app__dropdown_item"
                                      >
                                        <TableIcon className="w-4 h-4" />
                                        <span>Manage Criterias</span>
                                      </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleViewCommittees(item.id)
                                        }
                                        className="app__dropdown_item"
                                      >
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Manage Committees</span>
                                      </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div
                                        onClick={() =>
                                          handleViewEvaluator(item.id)
                                        }
                                        className="app__dropdown_item"
                                      >
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Manage Evaluators</span>
                                      </div>
                                    </Menu.Item>
                                  </>
                                )}
                                <Menu.Item>
                                  <div
                                    onClick={() =>
                                      handleViewApplicants(item.id)
                                    }
                                    className="app__dropdown_item"
                                  >
                                    <User2Icon className="w-4 h-4" />
                                    <span>View Applicants</span>
                                  </div>
                                </Menu.Item>
                                {hasAccess('rsp_manager') && (
                                  <Menu.Item>
                                    <div
                                      onClick={() => handleEdit(item)}
                                      className="app__dropdown_item"
                                    >
                                      <PencilSquareIcon className="w-4 h-4" />
                                      <span>Edit Details</span>
                                    </div>
                                  </Menu.Item>
                                )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <div className="font-medium">{item.position?.name}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                              <span className="app_td_mobile_label">
                                Position:
                              </span>{' '}
                              {item.position && (
                                <span>{item.position?.name}</span>
                              )}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">Type:</span>{' '}
                              {item.type} - {item.year}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Display On Job Postings:
                              </span>{' '}
                              {item.display_on_portal ? (
                                <span>
                                  Displayed from{' '}
                                  {format(
                                    new Date(item.display_on_portal_from),
                                    'MMM d, yyyy'
                                  )}{' '}
                                  until{' '}
                                  {format(
                                    new Date(item.display_on_portal_until),
                                    'MMM d, yyyy'
                                  )}
                                </span>
                              ) : (
                                'No'
                              )}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Chairman:
                              </span>{' '}
                              <UserBlock user={item.chairman} />
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Status:
                              </span>{' '}
                              {item.status}
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        {item.type} - {item.year}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.display_on_portal ? (
                          <span>
                            Displayed from{' '}
                            {format(
                              new Date(item.display_on_portal_from),
                              'MMM d, yyyy'
                            )}{' '}
                            until{' '}
                            {format(
                              new Date(item.display_on_portal_until),
                              'MMM d, yyyy'
                            )}
                          </span>
                        ) : (
                          'No'
                        )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <UserBlock user={item.chairman} />
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={6} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddEditModal
          refetch={() => setRefetch(!refetch)}
          editData={editData}
          hideModal={() => setShowAddModal(false)}
        />
      )}
      {/* Show Applicants Modal */}
      {showApplicantsModal && (
        <RankingApplicants
          rankingId={selectedId}
          hideModal={() => setShowApplicantsModal(false)}
        />
      )}
      {/* Show Criterias Modal */}
      {showCriteriasModal && (
        <RankingCriterias
          rankingId={selectedId}
          hideModal={() => setShowCriteriasModal(false)}
        />
      )}
      {/* Show Criterias Modal */}
      {showCommitteesModal && (
        <RankingCommittees
          rankingId={selectedId}
          hideModal={() => setShowCommitteesModal(false)}
        />
      )}
      {/* Show Evaluators Modal */}
      {showEvaluatorsModal && (
        <RankingEvaluators
          rankingId={selectedId}
          hideModal={() => setShowEvaluatorsModal(false)}
        />
      )}
    </>
  )
}
export default Page
