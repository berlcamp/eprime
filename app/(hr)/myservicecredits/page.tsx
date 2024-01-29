'use client'

import { fetchLeaveCards, fetchMyServiceCredits } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, CustomButton, RecordsSideBar } from '@/components'
import UploadModal from './UploadModal'
import { useSupabase } from '@/context/SupabaseProvider'
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scBalance, setScBalance] = useState(0)

  const [showUploadModal, setShowUploadModal] = useState(false)

  const [perPageCount, setPerPageCount] = useState<number>(10)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { session } = useSupabase()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchMyServiceCredits({ userId: session.user.id }, perPageCount, 0)
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
      const result = await fetchMyServiceCredits({ userId: session.user.id }, perPageCount, list.length)

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
  }, [perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  useEffect(() => {
    void (async () => {
      const result = await fetchLeaveCards(session.user.id, 'Service Credit', 10, 0)
      if (result.count && result.count > 0) {
        // first index of array should be the latest and updated balance
        const sc = result.data[0].balance
        setScBalance(sc)
      }
    })()
  }, [])

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

          {/* <div className='flex justify-end mt-2 px-4'><span className='border border-green-500 px-1 py-px font-semibold bg-green-200 text-gray-700 text-sm'>Available Service Credit Balance: {scBalance}</span></div> */}
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
                          Service Credit
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
                  !isDataEmpty && list.map((item: ServiceCreditUserTypes, index) => (
                    <tr
                      key={index}
                      className="app__tr">
                      <th
                        className="pl-4">
                        <div className='hidden md:inline-block font-medium'>{item.hrm_service_credits?.reference_code}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td_mobile">
                            <div><span className='app_td_mobile_label'>Reference Code:</span> {item.hrm_service_credits?.reference_code}</div>
                            <div><span className='app_td_mobile_label'>Particulars:</span> {item.hrm_service_credits?.particulars}</div>
                            <div><span className='app_td_mobile_label'>Service Credit Balance:</span> {item.service_credits}</div>
                            <div><span className='app_td_mobile_label'>Used Service Credit:</span> {item.used_service_credits}</div>
                            <div><span className='app_td_mobile_label'>Duration: </span>{item.hrm_service_credits ? format(new Date(item.hrm_service_credits.from), 'MMM d, yyyy') + ' - ' + format(new Date(item.hrm_service_credits.to), 'MMM d, yyyy') : ''}</div>
                            <div><span className='app_td_mobile_label'>Status: </span>
                              {
                                item.hrm_service_credits?.status === 'Expired'
                                  ? <span className='app__status_container_red'>Expired</span>
                                  : <>
                                      {
                                        item.is_approved
                                          ? <span className='app__status_container_green'>Active</span>
                                          : <span className='app__status_container_orange'>Pending Approval</span>
                                      }
                                    </>
                              }
                            </div>
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
                          <CustomButton
                            btnType='button'
                            title='Supporting Documents'
                            handleClick={() => handleEdit(item)}
                            containerStyles="app__btn_green"
                          />
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
