'use client'

import {
  CustomButton,
  PerPage,
  ShowMore,
  TableRowLoading,
  Title
} from '@/components/index'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchMyCtos } from '@/utils/fetchApi'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import UploadModal from './UploadModal'

// Types
import type { CtoUserTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

export default function Cto({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<CtoUserTypes[]>([])
  const [editData, setEditData] = useState<CtoUserTypes | null>(null)

  const [balance, setBalance] = useState(0)
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
      const result = await fetchMyCtos({ userId }, perPageCount, 0)
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
      const result = await fetchMyCtos({ userId }, perPageCount, list.length)

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
  }, [perPageCount])

  useEffect(() => {
    void (async () => {
      const result = await fetchMyCtos({ userId }, 999, 0)
      let bal = 0
      if (result.data) {
        const ctos: CtoUserTypes[] = result.data
        ctos.forEach((cto) => {
          if (cto.status !== 'Expired' && cto.is_approved) {
            bal += cto.coc
          }
        })
      }
      setBalance(bal)
    })()
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <>
      <div>
        <div className="app__title">
          <Title title="CTOs" />
        </div>

        <div className="mt-2 mx-4 text-right">
          <span className="app__status_container_green">
            Active COC Balance: {balance}
          </span>
        </div>

        <div className="app__warning_text">
          <span className="app__warning_title">Note:</span> Employee need to
          provide supporting documents as basis for CTO approval.
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
                <th className="hidden md:table-cell text-gray-700 pl-4">
                  Reference Code
                </th>
                <th className="hidden md:table-cell app__th">COC</th>
                <th className="hidden md:table-cell app__th">
                  Approval Status
                </th>
                <th className="hidden md:table-cell app__th">Particulars</th>
                <th className="hidden md:table-cell app__th">Duration</th>
                <th className="hidden md:table-cell app__th">Expiration</th>
                <th className="hidden md:table-cell app__th"></th>
                <th className="hidden md:table-cell app__th">
                  Expiration Status
                </th>
                <th className="hidden md:table-cell app__th">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {!isDataEmpty &&
                list.map((item: CtoUserTypes, index) => (
                  <tr key={index} className="app__tr">
                    <th className="pl-4">
                      <div className="hidden md:inline-block font-medium">
                        {item.hrm_ctos?.reference_code}
                      </div>
                      {/* Mobile View */}
                      <div>
                        <div className="md:hidden app__td_mobile">
                          <div>
                            <span className="app_td_mobile_label">
                              Reference Code:
                            </span>{' '}
                            {item.hrm_ctos?.reference_code}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Particulars:
                            </span>{' '}
                            {item.hrm_ctos?.particulars}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">COC:</span>{' '}
                            {item.coc}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Duration:{' '}
                            </span>
                            {item.hrm_ctos
                              ? format(
                                  new Date(item.hrm_ctos.from),
                                  'MMM d, yyyy'
                                ) +
                                ' - ' +
                                format(
                                  new Date(item.hrm_ctos.to),
                                  'MMM d, yyyy'
                                )
                              : ''}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Expiration:{' '}
                            </span>
                            {item.expiration &&
                              format(new Date(item.expiration), 'MMM d, yyyy')}
                          </div>
                          <div>
                            <span className="app_td_mobile_label">
                              Expiration Status:{' '}
                            </span>
                            {item.hrm_ctos?.status === 'Expired' ? (
                              <span className="app__status_container_red">
                                Expired
                              </span>
                            ) : (
                              <span className="app__status_container_green">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* End - Mobile View */}
                    </th>
                    <td className="hidden md:table-cell app__td">
                      <div className="font-semibold">{item.coc}</div>
                    </td>
                    <td className="hidden md:table-cell app__td">
                      {item.hrm_ctos?.status === 'Expired' ? (
                        <span className="app__status_container_red">
                          Expired
                        </span>
                      ) : (
                        <>
                          {item.is_approved ? (
                            <span className="app__status_container_green">
                              Approved
                            </span>
                          ) : (
                            <span className="app__status_container_orange">
                              Pending&nbsp;Approval
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="hidden md:table-cell app__td">
                      <div className="">{item.hrm_ctos?.particulars}</div>
                    </td>
                    <td className="hidden md:table-cell app__td">
                      <div>
                        {item.hrm_ctos
                          ? format(
                              new Date(item.hrm_ctos?.from),
                              'MMM d, yyyy'
                            ) +
                            ' - ' +
                            format(new Date(item.hrm_ctos?.to), 'MMM d, yyyy')
                          : ''}
                      </div>
                    </td>
                    <td className="hidden md:table-cell app__td">
                      <div>
                        {item.expiration &&
                          format(new Date(item.expiration), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="hidden md:table-cell app__td">
                      {item.hrm_ctos?.status !== 'Expired' &&
                        userId === session.user.id && (
                          <CustomButton
                            btnType="button"
                            title="Supporting&nbsp;Documents"
                            handleClick={() => handleEdit(item)}
                            containerStyles="app__btn_green"
                          />
                        )}
                    </td>
                    <td className="hidden md:table-cell app__td">
                      {item.hrm_ctos?.status === 'Expired' ? (
                        <span className="app__status_container_red">
                          Expired
                        </span>
                      ) : (
                        <span className="app__status_container_green">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell app__td">
                      {item.remarks}
                    </td>
                  </tr>
                ))}
              {loading && <TableRowLoading cols={8} rows={2} />}
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
      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          editData={editData}
          hideModal={() => setShowUploadModal(false)}
        />
      )}
    </>
  )
}
