'use client'

import { fetchMyCtos } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { Sidebar, PerPage, TopBar, TableRowLoading, ShowMore, Title, RecordsSideBar, CustomButton } from '@/components'
import uuid from 'react-uuid'
import Filters from './Filters'
import UploadModal from './UploadModal'
import { useSupabase } from '@/context/SupabaseProvider'

// Types
import type { CtoUserTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useSearchParams } from 'next/navigation'

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<CtoUserTypes[]>([])
  const [editData, setEditData] = useState<CtoUserTypes | null>(null)

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
      const result = await fetchMyCtos({ filterKeyword, userId: session.user.id }, perPageCount, 0)
      console.log('result.data', result.data)
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
      const result = await fetchMyCtos({ filterKeyword, userId: session.user.id }, perPageCount, list.length)

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

  const getStatus = (expiration: string | undefined) => {
    if (typeof expiration === 'undefined') return

    const today = new Date()
    const expirationDate = new Date(expiration)

    if (today >= expirationDate) {
      return 'Expired'
    } else {
      return 'Active'
    }
  }

  const handleEdit = (item: CtoUserTypes) => {
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

  return (
    <>
    <Sidebar>
      <RecordsSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='My CTOs'/>
          </div>

          {/* Filters */}
          <div className='app__filters'>
            <Filters
              filterKeyword={filterKeyword}
              setFilterKeyword={setFilterKeyword}
            />
          </div>

          <div className='app__warning_text'><span className='app__warning_title'>Note:</span> You need to provide supporting documents as basis for CTO approval.</div>

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
                          COC
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Particulars
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Duration
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Expiration
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Status
                      </th>
                      <th className="hidden md:table-cell app__th">
                          Supporting Documents
                      </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: CtoUserTypes) => (
                    <tr
                      key={uuid()}
                      className="app__tr">
                      <th
                        className="font-medium pl-4">
                        <div>{item.hrm_ctos?.reference_code}</div>
                        {/* Mobile View */}
                        <div>
                          <div className="md:hidden app__td">
                            <div className='font-light'>Particulars: {item.hrm_ctos?.particulars}</div>
                          </div>
                        </div>
                        {/* End - Mobile View */}

                      </th>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.hrm_ctos?.coc}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.hrm_ctos?.particulars}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_ctos?.from} -  {item.hrm_ctos?.to}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_ctos?.expiration}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            getStatus(item.hrm_ctos?.expiration) === 'Expired'
                              ? <div className='text-red-500 font-medium'>Expired</div>
                              : <>
                                  {
                                    item.is_approved
                                      ? <div className='text-green-500 font-medium'>Active</div>
                                      : <div className='text-orange-500 font-medium'>Pending Approval</div>
                                  }
                                </>
                          }
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            getStatus(item.hrm_ctos?.expiration) !== 'Expired' &&
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
