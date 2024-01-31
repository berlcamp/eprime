'use client'

import { fetchDocuments } from '@/utils/fetchApi'
import React, { useEffect, useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { Sidebar, TopBar, TableRowLoading, TrackerSideBar, UserBlock } from '@/components'
import DetailsModal from '@/components/Tracker/DetailsModal'
import { format } from 'date-fns'

// Types
import type { DocumentTypes } from '@/types'

import StickiesModal from '../StickiesModal'
import Link from 'next/link'
import { useSupabase } from '@/context/SupabaseProvider'
import { useDispatch, useSelector } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

export default function Page ({ params }: { params: { ref: string } }) {
  const [loading, setLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStickiesModal, setShowStickiesModal] = useState(false)
  const [list, setList] = useState<DocumentTypes[]>([])
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)

  const { session } = useSupabase()

  const refCode = params.ref

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const fetchData = async () => {
    setLoading(true)

    try {
      const result = await fetchDocuments({ filterKeyword: refCode }, null, session.user.id, 10, 0)

      // update the list in redux
      dispatch(updateList(result.data))

      setList(result.data)
      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShowDetailsModal = (item: DocumentTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist)
  }, [globallist])

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
  }, [])

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list

  return (
    <>
    <Sidebar>
      <TrackerSideBar/>
    </Sidebar>
    <div className="app__main">
      <div>
          {/* Header */}
          <TopBar/>
          <div className='app__title'>
            <Link href="/tracker" className='flex items-center app__btn_gray'>
              <ArrowLeftIcon className='w-5 h-5'/>
              All Requests
            </Link>
          </div>

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                  <tr>
                        <th className="app__th pl-4"></th>
                        <th className="app__th w-16">
                        </th>
                        <th className="app__th">
                          Reference Code
                        </th>
                        <th className="app__th">
                          Request Type
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Details
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Requester
                        </th>
                        <th className="hidden sm:table-cell app__th">
                          Current Status
                        </th>
                  </tr>
              </thead>
              <tbody>
                {
                  !isDataEmpty && list.map((item: DocumentTypes, index: number) => (
                    <tr key={index} className='app__tr'>
                      <td className='w-6 pl-4 app__td'>
                      </td>
                      <td className='pl-4 app__td'>
                        <div>
                          <button
                            onClick={() => handleShowDetailsModal(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                            >Request&nbsp;Details</button>
                        </div>
                      </td>
                      <td className='app__td'>
                        <div className='font-medium'>{item.reference_code}</div>
                      </td>
                      <td className='app__td'>
                        <div className='font-medium'>{item.type}</div>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                        {
                          (item.particulars && item.particulars.trim() !== '') &&
                            <div><span className='font-light'>Particulars:</span> <span className='font-medium'>{item.particulars}</span></div>
                        }
                        <div><span className='font-light'>Date Requested:</span> <span className='font-medium'>{format(new Date(item.created_at), 'MMM dd, yyyy h:mm a')}</span></div>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                          <UserBlock user={item.creator}/>
                      </td>
                      <td className='hidden sm:table-cell app__td'>
                        {item.current_status === 'Cancelled' && <span className='text-orange-700 px-1 bg-orange-100 border border-orange-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'Approval Recommended' && <span className='text-green-700 px-1 bg-green-100 border border-green-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'Approved' && <span className='text-green-700 px-1 bg-green-100 border border-green-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'Disapproved' && <span className='text-red-700 px-1 bg-red-100 border border-red-500 font-medium'>{item.current_status}</span>}
                        {item.current_status === 'For Verification' && <span className='text-blue-700 px-1 bg-blue-100 border border-blue-500 font-medium'>{item.current_status}</span>}
                        <div className='mt-1'>by {item.approver.firstname} {item.approver.middlename} {item.approver.lastname}</div>
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
          {/* Details Modal */}
          {
            (showDetailsModal && selectedItem) && (
              <DetailsModal
                documentData={selectedItem}
                hideModal={() => setShowDetailsModal(false)}/>
            )
          }
          {/* Stickies Modal */}
          {
            showStickiesModal && (
              <StickiesModal
                hideModal={() => setShowStickiesModal(false)}/>
            )
          }
      </div>
    </div>
  </>
  )
}
