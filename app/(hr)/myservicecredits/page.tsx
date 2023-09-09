'use client'

import { fetchMyServiceCredits } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, RecordsSideBar, CustomButton } from '@/components'
import uuid from 'react-uuid'
import Filters from './Filters'
import UploadModal from './UploadModal'
import { useSupabase } from '@/context/SupabaseProvider'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

// Types
import type { ServiceCreditUserTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<ServiceCreditUserTypes[]>([])
  const [editData, setEditData] = useState<ServiceCreditUserTypes | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()

  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  const [filterKeyword, setFilterKeyword] = useState(refCode ?? '')

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchMyServiceCredits({ filterKeyword, userId: session.user.id }, perPageCount, 0)
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
      const result = await fetchMyServiceCredits({ filterKeyword, userId: session.user.id }, perPageCount, list.length)

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

  const handleEdit = (item: ServiceCreditUserTypes) => {
    setShowUploadModal(true)
    setEditData(item)
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
  }, [filterKeyword, perPageCount, refCode])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  // count coc balance based on approved and active sc
  const scBalance = !isDataEmpty
    ? list.reduce((accumulator, sc) => {
      if (sc.is_approved && sc.hrm_service_credits?.status !== 'Expired') {
        return sc.service_credits + accumulator
      }
      return accumulator
    }, 0)
    : 0

  return (
    <>
    <Sidebar>
      <RecordsSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='My Service Credits'/>
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              filterKeyword={filterKeyword}
              setFilterKeyword={setFilterKeyword}
            />
          </div>

          <div className='flex justify-end px-4'><span className='border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700'>Available Service Credit Balance: {scBalance}</span></div>
          <div className='app__warning_text'><span className='app__warning_title'>Note:</span> You need to provide supporting documents as basis for approval.</div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}/>

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                  <tr>
                      <th className="hidden md:table-cell text-gray-700 pl-4">
                          Reference Code
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Status
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Service Credit Balance
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Particulars
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Work Duration
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Supporting Documents
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: ServiceCreditUserTypes) => (
                    <tr
                      key={uuid()}
                      className="app__tr">
                      <th
                        className="font-medium pl-4">
                        <div>{item.hrm_service_credits?.reference_code}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <div className='font-light'>Particulars: {item.hrm_service_credits?.particulars}</div>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                        {
                          item.is_approved
                            ? <span className='app__status_container_green'>Approved</span>
                            : <span className='app__status_container_orange'>Pending Approval</span>
                        }
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.service_credits}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className=''>{item.hrm_service_credits?.particulars}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_service_credits ? format(new Date(item.hrm_service_credits.from), 'MMM d, yyyy') + ' - ' + format(new Date(item.hrm_service_credits.to), 'MMM d, yyyy') : ''}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            item.hrm_service_credits?.status !== 'Expired' &&
                              <CustomButton
                                btnType='button'
                                title='Supporting Documents'
                                handleClick={() => handleEdit(item)}
                                containerStyles="app__btn_green"
                              />
                          }
                      </td>
                    </tr>
                  ))
                }
                { loading && <TableRowLoading cols={7} rows={2}/> }
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
    {/* Upload Modal */}
    {
      showUploadModal && (
        <UploadModal
          editData={editData}
          hideModal={() => setShowUploadModal(false)}/>
      )
    }
  </>
  )
}
export default Page
