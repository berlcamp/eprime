'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import type { FlowListTypes } from '@/types'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

function StatusFlow({
  documentId,
  updateStatusFlow
}: {
  documentId: string
  updateStatusFlow: boolean
}) {
  const [flowList, setFlowList] = useState<FlowListTypes[] | []>([])
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('hrm_tracker_flow')
        .select(
          '*, hrm_user:user_id(firstname,middlename,lastname),receiver:receiver_id(firstname,middlename,lastname), hrm_tracker_logs(*, hrm_user:user_id(firstname,middlename,lastname))',
          { count: 'exact' }
        )
        .eq('tracker_id', documentId)

      setFlowList(data)
    }
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateStatusFlow])

  return (
    <div className="w-full text-xs">
      {flowList.length > 0 &&
        flowList
          .slice() // Create a copy to avoid mutating the original array
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          ) // Oldest first
          .map((item, index) => (
            <div key={index} className="flex">
              <div
                className={`px-4 ${
                  index === 0 || index + 1 < flowList.length
                    ? 'border-r-2 border-gray-600 border-dashed'
                    : ''
                }`}
              >
                <div>{format(new Date(item.created_at), 'dd MMM yyyy')}</div>
                <div>{format(new Date(item.created_at), 'h:mm a')}</div>
              </div>
              <div className="relative">
                <span
                  className={`absolute -top-1 ${
                    index === 0 || index + 1 < flowList.length
                      ? '-left-[11px]'
                      : '-left-[9px]'
                  } inline-flex items-center justify-center border border-gray-600 rounded-full bg-white w-5 h-5`}
                >
                  <span className="rounded-full px-1 text-white text-xs"></span>
                </span>
              </div>
              <div
                className={`${
                  flowList.length > 1 && index + 1 < flowList.length
                    ? 'text-gray-500'
                    : 'text-gray-700 text-sm'
                } flex-1 ml-8 pb-4`}
              >
                <div className="font-bold">{item.status}</div>
                {(item.status === 'For Verification' ||
                  item.status === 'Approval Recommended' ||
                  item.status === 'Disapproved' ||
                  item.status === 'Approved') && (
                  <div className="text-xs">
                    by {item.hrm_user?.firstname} {item.hrm_user?.middlename}{' '}
                    {item.hrm_user?.lastname}
                  </div>
                )}
                {item.status === 'Forwarded' && (
                  <div className="text-xs">
                    to {item.receiver.firstname} {item.receiver.middlename}{' '}
                    {item.receiver.lastname}
                  </div>
                )}
                <div className="ml-12">
                  {item.hrm_tracker_logs.length > 0 &&
                    item.hrm_tracker_logs.map((log, index) => (
                      <div key={index} className="text-[11px]">
                        {log.message === 'Approval Recommended' && (
                          <span className="text-green-700 px-1 bg-green-100 border border-green-500 font-medium">
                            {log.message}
                          </span>
                        )}
                        {log.message === 'For Reverification' && (
                          <span className="text-orange-700 px-1 bg-orange-100 border border-orange-500 font-medium">
                            {log.message}
                          </span>
                        )}
                        {log.message === 'Cancelled' && (
                          <span className="text-blue-700 px-1 bg-blue-100 border border-blue-500 font-medium">
                            {log.message}
                          </span>
                        )}
                        {log.message === 'Approved' && (
                          <span className="text-green-900 px-1 bg-green-300 border border-green-700 font-medium">
                            {log.message}
                          </span>
                        )}
                        {log.message === 'Disapproved' && (
                          <span className="text-red-700 px-1 bg-red-100 border border-red-500 font-medium">
                            {log.message}
                          </span>
                        )}
                        <span className="font-normal">
                          {' '}
                          by {log.hrm_user?.firstname}{' '}
                          {log.hrm_user?.middlename} {log.hrm_user?.lastname}{' '}
                        </span>
                        <span>
                          {' '}
                          on{' '}
                          {format(
                            new Date(log.created_at),
                            'MMM dd,  yyyy h:mm a'
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
    </div>
  )
}

export default StatusFlow
