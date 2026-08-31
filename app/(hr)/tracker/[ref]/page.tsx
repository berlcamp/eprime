'use client'

import {
  Sidebar,
  TableError,
  TableRowLoading,
  TopBar,
  TrackerSideBar,
  UserBlock
} from '@/components/index'
import DetailsModal from '@/components/Tracker/DetailsModal'
import { useListQuery } from '@/hooks/useListQuery'
import { fetchDocuments } from '@/utils/fetchApi'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { format } from 'date-fns'
import { use, useState } from 'react'

// Types
import type { DocumentTypes } from '@/types'

import { useSupabase } from '@/context/SupabaseProvider'
import Link from 'next/link'
import StickiesModal from '../StickiesModal'

export default function Page({ params }: { params: Promise<{ ref: string }> }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStickiesModal, setShowStickiesModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null)

  const [refresh, setRefresh] = useState(false)

  const { session } = useSupabase()

  const { ref: refCode } = use(params)

  const { list, loading, error, isEmpty, refetch } =
    useListQuery<DocumentTypes>({
      fetcher: async (perPage, rangeFrom) =>
        await fetchDocuments(
          { filterKeyword: refCode },
          null,
          session?.user.id,
          perPage,
          rangeFrom
        ),
      deps: [refCode, refresh],
      perPage: 10
    })

  const handleShowDetailsModal = (item: DocumentTypes) => {
    setShowDetailsModal(true)
    setSelectedItem(item)
  }

  return (
    <>
      <Sidebar>
        <TrackerSideBar />
      </Sidebar>
      <div className="app__main">
        <div>
          {/* Header */}
          <TopBar />
          <div className="app__title">
            <Link href="/tracker" className="flex items-center app__btn_gray">
              <ArrowLeftIcon className="w-5 h-5" />
              All Requests
            </Link>
          </div>

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th pl-4"></th>
                  <th className="app__th w-16"></th>
                  <th className="app__th">Reference Code</th>
                  <th className="app__th">Request Type</th>
                  <th className="hidden sm:table-cell app__th">Details</th>
                  <th className="hidden sm:table-cell app__th">Requester</th>
                  <th className="hidden sm:table-cell app__th">
                    Current Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((item: DocumentTypes, index: number) => (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td"></td>
                      <td className="pl-4 app__td">
                        <div>
                          <button
                            onClick={() => handleShowDetailsModal(item)}
                            className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-1 py-px text-xs text-white rounded-sm"
                          >
                            Request&nbsp;Details
                          </button>
                        </div>
                      </td>
                      <td className="app__td">
                        <div className="font-medium">{item.reference_code}</div>
                      </td>
                      <td className="app__td">
                        <div className="font-medium">{item.type}</div>
                      </td>
                      <td className="hidden sm:table-cell app__td">
                        {item.particulars && item.particulars.trim() !== '' && (
                          <div>
                            <span className="font-light">Particulars:</span>{' '}
                            <span className="font-medium">
                              {item.particulars}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-light">Date Requested:</span>{' '}
                          <span className="font-medium">
                            {format(
                              new Date(item.created_at),
                              'MMM dd, yyyy h:mm a'
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell app__td">
                        <UserBlock user={item.creator} />
                      </td>
                      <td className="hidden sm:table-cell app__td">
                        {item.current_status === 'Cancelled' && (
                          <span className="text-orange-700 px-1 bg-orange-100 border border-orange-500 font-medium">
                            {item.current_status}
                          </span>
                        )}
                        {item.current_status === 'Approval Recommended' && (
                          <span className="text-green-700 px-1 bg-green-100 border border-green-500 font-medium">
                            {item.current_status}
                          </span>
                        )}
                        {item.current_status === 'Approved' && (
                          <span className="text-green-700 px-1 bg-green-100 border border-green-500 font-medium">
                            {item.current_status}
                          </span>
                        )}
                        {item.current_status === 'Disapproved' && (
                          <span className="text-red-700 px-1 bg-red-100 border border-red-500 font-medium">
                            {item.current_status}
                          </span>
                        )}
                        {item.current_status === 'For Verification' && (
                          <span className="text-blue-700 px-1 bg-blue-100 border border-blue-500 font-medium">
                            {item.current_status}
                          </span>
                        )}
                        <div className="mt-1">
                          by {item.approver.firstname}{' '}
                          {item.approver.middlename} {item.approver.lastname}
                        </div>
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={7} rows={2} />}
              </tbody>
            </table>
            {error && <TableError error={error} onRetry={refetch} />}
            {isEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>
          {/* Details Modal */}
          {showDetailsModal && selectedItem && (
            <DetailsModal
              refresh={() => setRefresh(!refresh)}
              documentData={selectedItem}
              hideModal={() => setShowDetailsModal(false)}
            />
          )}
          {/* Stickies Modal */}
          {showStickiesModal && (
            <StickiesModal hideModal={() => setShowStickiesModal(false)} />
          )}
        </div>
      </div>
    </>
  )
}
