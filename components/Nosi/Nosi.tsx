'use client'

import { PerPage, ShowMore, TableRowLoading, Title } from '@/components/index'
import { fetchNosi } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'

// Types
import type { NosiTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { formatToPesos } from '@/utils/text-helper'
import { useDispatch, useSelector } from 'react-redux'

export default function Nosi({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [perPageCount, setPerPageCount] = useState<number>(10)

  const [list, setList] = useState<NosiTypes[]>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchNosi({ filterUser: userId }, perPageCount, 0)

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

  const handleShowMore = async () => {
    setLoading(true)

    try {
      const result = await fetchNosi(
        { filterUser: userId },
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
        <div className="app__title">
          <Title title="NOSI" />
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
                <th className="app__th">Original Salary</th>
                <th className="app__th">Adjusted Salary</th>
              </tr>
            </thead>
            <tbody>
              {!isDataEmpty &&
                list.map((item, index) => (
                  <tr key={index} className="app__tr">
                    <td className="app__td">
                      <div className="">
                        As of {item.as_of_date}: SG{' '}
                        <span className="font-bold text-sm">
                          {item.previous_grade}
                        </span>
                        , Step{' '}
                        <span className="font-bold text-sm">
                          {item.previous_step}
                        </span>
                        , Salary{' '}
                        <span className="font-bold text-sm">
                          {formatToPesos(Number(item.previous_amount))}
                        </span>
                      </div>
                    </td>
                    <td className="app__td">
                      <div className="">
                        Effective {item.effective_date}: SG{' '}
                        <span className="font-bold text-sm">
                          {item.new_grade}
                        </span>
                        , Step{' '}
                        <span className="font-bold text-sm">
                          {item.new_step}
                        </span>
                        , Salary{' '}
                        <span className="font-bold text-sm">
                          {formatToPesos(Number(item.new_amount))}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              {loading && <TableRowLoading cols={2} rows={2} />}
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
    </>
  )
}
