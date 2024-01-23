'use client'
import React, { useEffect, useState } from 'react'
import { Sidebar, TopBar, Title, RequestsSideBar, UserBlock } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'

// Types
import type { LeaveTypes } from '@/types'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'

export default function Page ({ params }: { params: { ref: string } }) {
  const [loading, setLoading] = useState(false)
  const { supabase } = useSupabase()

  const [leaveData, setLeaveData] = useState<LeaveTypes | null>(null)

  const refCode = params.ref

  const fetchData = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('hrm_leave_requests')
        .select('*, requester:requester_id(*)')
        .eq('reference_code', refCode)
        .maybeSingle()

      if (error) throw new Error(error.message)
      console.log('data', data)
      setLeaveData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  // Featch data
  useEffect(() => {
    void fetchData()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
    <Sidebar>
      <RequestsSideBar/>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
          <div className='app__title'>
            <Title title='Leave Details'/>
          </div>
          {
            loading && <TwoColTableLoading/>
          }
          {
            (!loading && leaveData) &&
              <div>
                <div className='mx-4 p-4 my-4 bg-slate-100'>
                  <div className='flex flex-col space-y-2 lg:space-y-0 lg:space-x-2  lg:flex-row justify-between'>
                    <div className='w-full px-2 border-l-2 space-y-2'>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Requester:</div>
                        <div className=''>
                          <UserBlock user={leaveData.requester}/>
                        </div>
                      </div>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                    </div>
                    <div className='w-full px-2 border-l-2 space-y-2'>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                      <div className='flex space-x-2 text-xs'>
                        <div className=''>Referece Code:</div>
                        <div className='font-medium'>{ leaveData.reference_code }</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='mx-4 p-4 my-4 bg-slate-100'>
                  <div className='flex flex-col space-y-2 lg:space-y-0 lg:space-x-2  lg:flex-row justify-between'>
                    <div className='border w-full'>adasf</div>
                    <div className='border w-full'>adasf</div>
                  </div>
                </div>
              </div>
          }
      </div>
    </div>
  </>
  )
}
