'use client'

import {
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { fetchRankingApplicants } from '@/utils/fetchApi'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import React, { Fragment, useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { ApplicantTypes } from '@/types'

// Redux imports
import ApplicantDetails from '@/components/Rsp/ApplicantDetails'
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { ArrowUpRight, EyeIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import MoveRanking from './MoveRanking'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null)

  const [list, setList] = useState<ApplicantTypes[]>([])
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterRanking, setFilterRanking] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchRankingApplicants(
        { filterRanking, filterKeyword },
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
        { filterRanking, filterKeyword },
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

  const handleViewDetails = (item: ApplicantTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
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
  }, [perPageCount, filterRanking, filterKeyword])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // Check access from permission settings or Super Admins
  if (!hasAccess('rsp_manager')) return <Unauthorized />

  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Ranking Applicants" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterRanking={setFilterRanking}
              setFilterKeyword={setFilterKeyword}
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
                  <th className="hidden md:table-cell app__th">Applicant</th>
                  <th className="hidden md:table-cell app__th">Ranking</th>
                  <th className="hidden md:table-cell app__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: ApplicantTypes, index) => (
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
                                <Menu.Item>
                                  <div
                                    onClick={() => handleMoveToRanking(item)}
                                    className="app__dropdown_item"
                                  >
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span>Move to Another Ranking</span>
                                  </div>
                                </Menu.Item>
                                <Menu.Item>
                                  <div
                                    onClick={() => handleViewDetails(item)}
                                    className="app__dropdown_item"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                    <span>View Applicant Details</span>
                                  </div>
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                      <th className="app__th_firstcol">
                        <div className="font-medium">
                          {item.lastname}, {item.firstname} {item.middlename}
                        </div>
                        <div className="font-light">{item.email}</div>
                        {item.current_employee === 'Yes' && (
                          <div className="font-bold">
                            (Current DepEd Employee)
                          </div>
                        )}
                        {item.previous_applicant === 'Yes' && (
                          <div className="font-bold">(Previous Applicant)</div>
                        )}

                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                              <span className="app_td_mobile_label">
                                Ranking:
                              </span>{' '}
                              <span>
                                {item.ranking.position.name} -{' '}
                                {item.ranking.type}
                              </span>
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Status
                              </span>{' '}
                              {item.ranking.status}
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        {item.ranking.position.name} - {item.ranking.type}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.ranking.status}
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={4} rows={2} />}
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

          {/* Show Criterias Modal */}
          {selectedItem && showMoveModal && (
            <MoveRanking
              applicantData={selectedItem}
              hideModal={() => setShowMoveModal(false)}
            />
          )}

          {/* Show Details Modal */}
          {selectedItem && showDetailsModal && (
            <ApplicantDetails
              applicantData={selectedItem}
              hideModal={() => setShowDetailsModal(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}
export default Page
