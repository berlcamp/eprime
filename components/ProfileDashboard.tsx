'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import Title from './Title'
import UserRequests from './Tracker/UserRequests'
import { useEffect, useState } from 'react'
import type { DocumentTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useFilter } from '@/context/FilterContext'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'

export default function ProfileDashboard ({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  // counters state
  const [leaveCounter, setLeaveCounter] = useState(0)
  const [travelCounter, setTravelCounter] = useState(0)
  const [passSlipCounter, setPassSlipCounter] = useState(0)
  const [underTimeCounter, setUnderTimeCounter] = useState(0)
  const [locatorSlipCounter, setLocatorSlipCounter] = useState(0)
  const [srPrintCounter, setSrPrintCounter] = useState(0)

  const [approvedLeave, setApprovedLeave] = useState<DocumentTypes[] | []>([])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('hrm_request_trackers')
        .select()
        .eq('created_by', userId)
        .neq('current_status', 'Cancelled')

      if (error) {
        void logError('Fetch requests from profile dashboard', 'hrm_request_trackers', '', error.message)
        setToast('error', 'Fetching dashboard data failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      if (data) {
        void counter(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const counter = (requestData: DocumentTypes[]) => {
    // Count leave
    const leave = requestData.filter(item => item.type === 'Leave')
    setLeaveCounter(leave.length)

    // Count Travel
    const travel = requestData.filter(item => item.type === 'Travel Authority')
    setTravelCounter(travel.length)

    // Count Pass Slip
    const passSlip = requestData.filter(item => item.type === 'Pass Slip')
    setPassSlipCounter(passSlip.length)

    // Count Locator Slip
    const locator = requestData.filter(item => item.type === 'Locator Slip')
    setLocatorSlipCounter(locator.length)

    // Count Undertime Permit
    const undertime = requestData.filter(item => item.type === 'Undertime Permit')
    setUnderTimeCounter(undertime.length)

    // Count SR Print
    const sr = requestData.filter(item => item.type === 'Service Record Print Request')
    setSrPrintCounter(sr.length)

    // Approved leave
    const approved = requestData.filter(item => (item.type === 'Leave' && item.current_status === 'Approved'))
    setApprovedLeave(approved)
  }

  useEffect(() => {
    void fetchRequests()
  }, [])

  return (
    <>
      <div>
        <div className='app__title'>
          <Title title='Dashboard'/>
        </div>

        {/* Main Content */}
        <div className='w-full px-2 pt-4 bg-gray-100'>
          <div className="container mx-auto p-2 lg:grid lg:grid-cols-1 lg:gap-2">
            <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
              <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                Requests Applied
              </div>
              <div className='items-center'>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Leave</div>
                  <div className='text-xs text-gray-700 font-bold'>{leaveCounter}</div>
                </div>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Travel Authority</div>
                  <div className='text-xs text-gray-700 font-bold'>{travelCounter}</div>
                </div>
                <div className='inline-flex flex-col text-center px-2'>
                  <div className='text-xs text-gray-500'>Pass Slip</div>
                  <div className='text-xs text-gray-700 font-bold'>{passSlipCounter}</div>
                </div>
                <div className='inline-flex flex-col text-center px-2'>
                  <div className='text-xs text-gray-500'>Undertime Permit</div>
                  <div className='text-xs text-gray-700 font-bold'>{underTimeCounter}</div>
                </div>
                <div className='inline-flex flex-col text-center px-2'>
                  <div className='text-xs text-gray-500'>Locator Slip</div>
                  <div className='text-xs text-gray-700 font-bold'>{locatorSlipCounter}</div>
                </div>
                <div className='inline-flex flex-col text-center px-2'>
                  <div className='text-xs text-gray-500'>SR Print Request</div>
                  <div className='text-xs text-gray-700 font-bold'>{srPrintCounter}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="container mx-auto p-2 lg:grid lg:grid-cols-1 lg:gap-2">
            <div className="bg-white p-4 rounded-md shadow-md mb-4">
              <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                Approved Leave
              </div>
              {
                approvedLeave.length > 0
                  ? <div className='px-2'>
                      <table className='w-full'>
                        <thead>
                          <tr>
                            <th className='text-xs text-left text-gray-600 font-medium'>Type</th>
                            <th className='text-xs text-left text-gray-600 font-medium'>Inclusive Days</th>
                            <th className='text-xs text-left text-gray-600 font-medium'>Days with Pay</th>
                            <th className='text-xs text-left text-gray-600 font-medium'>Days without Pay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            approvedLeave.map((leave) => (
                              <tr key={nanoid()}>
                                <td className='text-xs text-gray-600 font-normal'>{leave.leave_type}</td>
                                <td className='text-xs text-gray-600 font-normal'>{format(new Date(leave.leave_from), 'MMMM dd, yyyy')} - {format(new Date(leave.leave_to), 'MMMM dd, yyyy')}</td>
                                <td className='text-xs text-gray-600 font-normal'>0</td>
                                <td className='text-xs text-gray-600 font-normal'>0</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  : <div className='px-2 text-xs text-gray-600'>No approved leave record yet</div>
              }
            </div>
          </div>
          {
            userId === session.user.id &&
              <div className="container mx-auto p-2 lg:grid lg:grid-cols-1 lg:gap-2">
                <div className="bg-white p-4 rounded-md shadow-md mb-4">
                  <h2 className="text-sm font-semibold mb-4 text-gray-600">Requests That Needs Your Action</h2>
                  <UserRequests forDashboard={true} userId={userId}/>
                </div>
              </div>
          }
        </div>
      </div>
  </>
  )
}
