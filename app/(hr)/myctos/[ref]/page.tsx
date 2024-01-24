'use client'

import { fetchMyCtos } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { Sidebar, TopBar, TableRowLoading, CustomButton, RecordsSideBar } from '@/components'
import uuid from 'react-uuid'
import UploadModal from '../UploadModal'
import { useSupabase } from '@/context/SupabaseProvider'
import { format } from 'date-fns'

// Types
import type { CtoUserTypes } from '@/types'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

export default function Page ({ params }: { params: { ref: string } }) {
  const [loading, setLoading] = useState(false)

  const [list, setList] = useState<CtoUserTypes[]>([])
  const [editData, setEditData] = useState<CtoUserTypes | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)

  const { session } = useSupabase()

  const refCode = params.ref

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchMyCtos({ filterKeyword: refCode, userId: session.user.id }, 1000, 0)

      setList(result.data)
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
            <Link href="/myctos" className='flex items-center app__btn_gray'>
              <ArrowLeftIcon className='w-5 h-5'/>
              My CTO&apos;s
            </Link>
          </div>

          <div className='app__warning_text'><span className='app__warning_title'>Note:</span> You need to provide supporting documents as basis for CTO approval.</div>

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
                          {
                            item.hrm_ctos?.status === 'Expired'
                              ? <span className='app__status_container_red'>Expired</span>
                              : <>
                                  {
                                    item.is_approved
                                      ? <span className='app__status_container_green'>Active</span>
                                      : <span className='app__status_container_orange'>Pending Approval</span>
                                  }
                                </>
                          }
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className='font-semibold'>{item.hrm_ctos?.coc}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div className=''>{item.hrm_ctos?.particulars}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{item.hrm_ctos?.from} -  {item.hrm_ctos?.to}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                        <div>{format(new Date(item.expiration), 'MMM d, yyyy')}</div>
                      </td>
                      <td
                        className="hidden md:table-cell app__td">
                          {
                            item.hrm_ctos?.status !== 'Expired' &&
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
