'use client'

import {
  CustomButton,
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
  UserBlock
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { fetchRankings } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import Filters from './Filters'

// Types
import type { RankingTypes } from '@/types'

// Redux imports
import RspSidebar from '@/components/Sidebars/RspSidebar'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'
import RankingApplicants from './RankingApplicants'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [showApplicantsModal, setShowApplicantsModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const [list, setList] = useState<RankingTypes[]>([])
  const [filterPosition, setFilterPosition] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { hasAccess } = useFilter()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchRankings(
        { filterStatus: 'Closed', filterPosition },
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
        { filterStatus: 'Closed', filterPosition },
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

  const handleViewApplicants = (id: string) => {
    setShowApplicantsModal(true)
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
  }, [perPageCount, filterPosition, filterStatus])

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
            <Title title="Ranking Results" />
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
                  <th className="hidden md:table-cell app__th">Position</th>
                  <th className="hidden md:table-cell app__th"></th>
                  <th className="hidden md:table-cell app__th">Type</th>
                  <th className="hidden md:table-cell app__th"></th>
                  <th className="hidden md:table-cell app__th">Chairman</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: RankingTypes, index) => (
                    <tr key={index} className="app__tr">
                      <td className="pl-4 app__td">
                        {item.position.name}
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div>
                              <span className="app_td_mobile_label">
                                Position:
                              </span>{' '}
                              {item.position && (
                                <span>{item.position.name}</span>
                              )}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">Type:</span>{' '}
                              {item.type}
                            </div>
                            <div>
                              <span className="app_td_mobile_label">
                                Chairman:
                              </span>{' '}
                              <UserBlock user={item.chairman} />
                            </div>
                            <div>
                              <CustomButton
                                containerStyles="app__btn_green_xs"
                                title="Vew Results"
                                btnType="button"
                                handleClick={() =>
                                  handleViewApplicants(item.id)
                                }
                              />
                            </div>
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <CustomButton
                          containerStyles="app__btn_green_xs"
                          title="Vew Results"
                          btnType="button"
                          handleClick={() => handleViewApplicants(item.id)}
                        />
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.type}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <UserBlock user={item.chairman} />
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
        </div>
      </div>

      {/* Show Applicants Modal */}
      {showApplicantsModal && (
        <RankingApplicants
          rankingId={selectedId}
          hideModal={() => setShowApplicantsModal(false)}
        />
      )}
    </>
  )
}
export default Page
