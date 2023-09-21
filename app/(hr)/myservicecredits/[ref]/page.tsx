'use client'

import { fetchMyServiceCredits } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { Sidebar, TopBar, TableRowLoading, Title, CustomButton, RecordsSideBar } from '@/components'
import uuid from 'react-uuid'
import UploadModal from '../UploadModal'
import { useSupabase } from '@/context/SupabaseProvider'

// Types
import type { ServiceCreditUserTypes } from '@/types'

export default function Page ({ params }: { params: { ref: string } }) {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<ServiceCreditUserTypes[]>([])
  const [editData, setEditData] = useState<ServiceCreditUserTypes | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)

  const { session } = useSupabase()

  const refCode = params.ref

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchMyServiceCredits({ filterKeyword: refCode, userId: session.user.id }, 1000, 0)

      setList(result.data)
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

  // Featch data
  useEffect(() => {
    void fetchData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            <Title title=''/>
          </div>

          <div className='app__warning_text'><span className='app__warning_title'>Note:</span> You need to provide supporting documents as basis for approval.</div>

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
                          Duration
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
                        <div className='font-semibold'>{item.hrm_service_credits?.service_credits}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className=''>{item.hrm_service_credits?.particulars}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_service_credits?.from} -  {item.hrm_service_credits?.to}</div>
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
                { loading && <TableRowLoading cols={6} rows={2}/> }
              </tbody>
            </table>
            {
              (!loading && isDataEmpty) &&
                <div className='app__norecordsfound'>No records found.</div>
            }
          </div>
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
