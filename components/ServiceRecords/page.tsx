'use client'

import { fetchServiceRecords } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { TableRowLoading, Title, PerPage, ShowMore } from '@/components'

// Types
import type { ServiceRecordTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

export default function ServiceRecords ({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [perPageCount, setPerPageCount] = useState<number>(10)

  const [list, setList] = useState<ServiceRecordTypes[]>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchServiceRecords(userId, perPageCount, 0)

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

  const handleShowMore = async () => {
    setLoading(true)

    try {
      const result = await fetchServiceRecords(userId, perPageCount, list.length)

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

  // Featch data
  useEffect(() => {
    void fetchData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <>
      <div>
        <div className='app__title'>
          <Title title='Service Records'/>
        </div>

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
                <th>
                </th>
                <th className="hidden md:table-cell text-gray-700 pl-4">
                    Inclusive Dates
                </th>
                <th className="hidden md:table-cell app__th">
                    Designation
                </th>
                <th className="hidden md:table-cell app__th">
                    Status
                </th>
                <th className="hidden md:table-cell app__th">
                    Salary
                </th>
                <th className="hidden md:table-cell app__th">
                    Station / Branch
                </th>
                <th className="hidden md:table-cell app__th">
                    Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {
                !isDataEmpty && list.map((item, index) => (
                  <tr
                    key={index}
                    className="app__tr">
                    <th className="app__th_firstcol">
                      {/* Mobile View */}
                      <div>
                        <div className="md:hidden app__td_mobile">
                          <div><span className='app_td_mobile_label'>From:</span> {item.from}</div>
                          <div><span className='app_td_mobile_label'>To:</span> {item.to}</div>
                          <div><span className='app_td_mobile_label'>Designation:</span> {item.designation}</div>
                          <div><span className='app_td_mobile_label'>Status:</span> {item.status}</div>
                          <div><span className='app_td_mobile_label'>Salary:</span> {item.salary}</div>
                          <div><span className='app_td_mobile_label'>Station:</span> {item.station}</div>
                          <div><span className='app_td_mobile_label'>Branch:</span> {item.branch}</div>
                          <div><span className='app_td_mobile_label'>Separation Date:</span> {item.separation_date}</div>
                          <div><span className='app_td_mobile_label'>Separation Cause:</span> {item.separation_cause}</div>
                          <div><span className='app_td_mobile_label'>Remarks:</span> {item.remarks}</div>
                        </div>
                      </div>
                      {/* End - Mobile View */}
                    </th>
                    <td className="hidden md:table-cell app__td">
                      <div>From: {item.from}</div>
                      <div>To: {item.to}</div>
                    </td>
                    <td className="hidden md:table-cell app__td">{item.designation}</td>
                    <td className="hidden md:table-cell app__td">{item.status}</td>
                    <td className="hidden md:table-cell app__td">{item.salary}</td>
                    <td className="hidden md:table-cell app__td">
                      <div>Station: {item.station}</div>
                      <div>Branch: {item.branch}</div>
                    </td>
                    <td className="hidden md:table-cell app__td">{item.remarks}</td>
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
  </>
  )
}
