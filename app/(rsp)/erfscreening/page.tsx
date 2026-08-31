'use client'

import {
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  UserBlock
} from '@/components/index'
import { fetchRankingApplicants } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { format } from 'date-fns'
import React, { Fragment, useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { ApplicantTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ArrowUpRight } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import DetailsModal from './DetailsModal'
import MoveRanking from '@/components/Rsp/MoveRanking'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)

  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterSchool, setFilterSchool] = useState<string>('')
  const [filterOffice, setFilterOffice] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [list, setList] = useState<ApplicantTypes[]>([])
  const [perPageCount, setPerPageCount] = useState<number>(10)

  const { session } = useSupabase()
  const { hasAccess } = useFilter()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchRankingApplicants(
        {
          filterSchool,
          filterOffice,
          filterStatus,
          filterKeyword,
          filterType: 'Reclassification'
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
      const result = await fetchRankingApplicants(
        {
          filterKeyword,
          filterSchool,
          filterOffice,
          filterStatus,
          filterType: 'Reclassification'
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

  const handleMoveToRanking = (item: ApplicantTypes) => {
    setShowMoveModal(true)
    setSelectedItem(item)
  }

  const handleShowDetailsModal = (item: ApplicantTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    // Filter only allowed data
    if (globallist) {
      if (hasAccess('rsp_manager') || hasAccess('hr')) {
        setList(globallist)
      } else {
        const filteredList = globallist.filter(
          (d: ApplicantTypes) =>
            d.current_approver_id || d.user_id === session?.user.id
        )
        setList(filteredList)
      }
    } else {
      setList(globallist)
    }
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKeyword, filterSchool, filterOffice, filterStatus, perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list
  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <div className="app__main">
        <div>
          {/* Header */}
          <TopBar />
          <div className="app__title">
            <Title title="ERF " />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterSchool={setFilterSchool}
              setFilterOffice={setFilterOffice}
              setFilterStatus={setFilterStatus}
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
                  <th className="app__th pl-4"></th>
                  <th className="app__th w-16"></th>
                  <th className="app__th">Reference Code</th>
                  <th className="app__th">Applicant</th>
                  <th className="app__th">Date Applied</th>
                  <th className="app__th">Current Status</th>
                  <th className="app__th">Forwarded To</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: ApplicantTypes, index: number) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td">
                        {(hasAccess('rsp_manager') || hasAccess('hr')) && (
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
                                  <Menu.Item>
                                    <div
                                      onClick={() => handleMoveToRanking(item)}
                                      className="app__dropdown_item"
                                    >
                                      <ArrowUpRight className="w-4 h-4" />
                                      <span>Move to Ranking</span>
                                    </div>
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        )}
                      </td>
                      <td className="pl-4 app__td">
                        <div>
                          <button
                            onClick={() => handleShowDetailsModal(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                          >
                            View&nbsp;Details
                          </button>
                        </div>
                      </td>
                      <td className="app__td">
                        <div className="font-medium">{item.code}</div>
                      </td>
                      <td className="app__td">
                        <UserBlock user={item.employee} />
                      </td>
                      <td className="app__td">
                        <span className="font-medium">
                          {format(
                            new Date(item.created_at),
                            'MMM dd, yyyy h:mm a'
                          )}
                        </span>
                      </td>

                      <td className="app__td">
                        {item.status === 'For AO Verification' && (
                          <span className="app__status_orange">
                            {item.status}
                          </span>
                        )}
                        {item.status === 'Verified By AO' && (
                          <span className="app__status_green">
                            {item.status}
                          </span>
                        )}
                        {item.status === 'Verified By HR' && (
                          <span className="app__status_green">
                            {item.status}
                          </span>
                        )}
                        {item.status === 'Not Qualified' && (
                          <span className="app__status_red">{item.status}</span>
                        )}
                      </td>
                      <td className="app__td">
                        <UserBlock user={item.approver} />
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={7} rows={2} />}
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

          {/* Show Move to ranking Modal */}
          {selectedItem && showMoveModal && (
            <MoveRanking
              applicantData={selectedItem}
              hideModal={() => setShowMoveModal(false)}
            />
          )}

          {/* Details Modal */}
          {showDetailsModal && selectedItem && (
            <DetailsModal
              documentData={selectedItem}
              hideModal={() => setShowDetailsModal(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
export default Page
