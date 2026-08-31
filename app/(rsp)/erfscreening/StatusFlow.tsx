'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import type { FlowListTypes } from '@/types'
import { runListQuery, type QueryError } from '@/utils/query-result'
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
  const [error, setError] = useState<QueryError | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      const result = await runListQuery<FlowListTypes>(
        {
          transaction: 'Fetch applicant status flow',
          table: 'hrm_ranking_applicant_flow',
          payload: { applicantId: documentId },
          userMessage: 'Could not load this applicant history.'
        },
        supabase
          .from('hrm_ranking_applicant_flow')
          .select(
            '*, hrm_user:user_id(firstname,middlename,lastname),receiver:receiver_id(firstname,middlename,lastname)',
            { count: 'exact' }
          )
          .eq('applicant_id', documentId)
      )

      // An empty flow list and a failed query both rendered as "no history".
      if (!result.ok) {
        setError(result.error)
        return
      }

      setError(null)
      setFlowList(result.data)
    }
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateStatusFlow])

  if (error) {
    return (
      <div className="w-full text-xs">
        <div className="text-red-600">{error.message}</div>
      </div>
    )
  }

  return (
    <div className="w-full text-xs">
      {flowList.length > 0 &&
        flowList.map((item, index) => (
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
              {(item.status === 'Verified By AO' ||
                item.status === 'Verified By HR') && (
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
            </div>
          </div>
        ))}
    </div>
  )
}

export default StatusFlow
