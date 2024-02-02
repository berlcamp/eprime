'use client'

import { fetchMyPromotions } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { PerPage, TableRowLoading, ShowMore, Title, CustomButton, UserBlock } from '@/components'
import UploadModal from './UploadModal'
import { useSupabase } from '@/context/SupabaseProvider'
import { format } from 'date-fns'

// Types
import type { PromotionTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

export default function Promotions ({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<PromotionTypes[]>([])
  const [editData, setEditData] = useState<PromotionTypes | null>(null)

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
      const result = await fetchMyPromotions(userId, perPageCount, 0)
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
      const result = await fetchMyPromotions(userId, perPageCount, list.length)

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

  const handleAttachments = (item: PromotionTypes) => {
    setShowUploadModal(true)
    setEditData(item)
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    setList([])
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPageCount])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <>
    <div>
        <div className='app__title'>
          <Title title='Promotions'/>
        </div>

        <div className='app__warning_text'><span className='app__warning_title'>Note:</span> Employee need to provide supporting documents as basis for Promotion approval.</div>

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
                    <th className="hidden md:table-cell"></th>
                    <th className="hidden md:table-cell app__th">
                    </th>
                    <th className="hidden md:table-cell app__th">
                        Employee
                    </th>
                    <th className="hidden md:table-cell app__th">
                        New Position
                    </th>
                    <th className="hidden md:table-cell app__th">
                        Effectivity Date
                    </th>
                    <th className="hidden md:table-cell app__th">
                        Status
                    </th>
                </tr>
            </thead>
            <tbody>
              {
                !isDataEmpty && list.map((item: PromotionTypes, index) => (
                  <tr
                    key={index}
                    className="app__tr">
                    <td
                      className="w-6 pl-4 app__td"></td>
                    <th
                      className="app__td">
                      {
                        (item.status !== 'Approved' && session.user.id === userId) &&
                          <CustomButton
                            btnType='button'
                            title='Supporting Documents'
                            handleClick={() => handleAttachments(item)}
                            containerStyles="app__btn_green"
                          />
                      }
                      {/* Mobile View */}
                      <div>
                        <div className="md:hidden app__td_mobile">
                          <div><span className='app_td_mobile_label'>New Position:</span> {item.hrm_item?.hrm_position?.name}</div>
                          <div><span className='app_td_mobile_label'>Effectivity Date: </span>{format(new Date(item.effectivity_date), 'MMM d, yyyy')}</div>
                          <div>
                            <span className='app_td_mobile_label'>Status: </span>
                            {item.status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                            {item.status === 'For Verification' && <span className='app__status_container_orange'>For Verification</span>}
                            {item.status === 'For Final Approval' && <span className='app__status_container_orange'>For Final Approval</span>}
                            {item.status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                          </div>
                        </div>
                      </div>
                      {/* End - Mobile View */}

                    </th>
                    <td
                      className="hidden md:table-cell app__td">
                        <UserBlock user={item.hrm_user}/>
                    </td>
                    <td
                      className="hidden md:table-cell app__td">
                      <div className='font-semibold'>{item.hrm_item.hrm_position.name}</div>
                    </td>
                    <td
                      className="hidden md:table-cell app__td">
                      <div>{format(new Date(item.effectivity_date), 'MMM d, yyyy')}</div>
                    </td>
                    <td
                      className="hidden md:table-cell app__td">
                        {item.status === 'Approved' && <span className='app__status_container_green'>Approved</span>}
                        {item.status === 'For Verification' && <span className='app__status_container_orange'>For Verification</span>}
                        {item.status === 'For Final Approval' && <span className='app__status_container_orange'>For Final Approval</span>}
                        {item.status === 'Disapproved' && <span className='app__status_container_red'>Disapproved</span>}
                    </td>
                  </tr>
                ))
              }
              { loading && <TableRowLoading cols={6} rows={2}/> }
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
