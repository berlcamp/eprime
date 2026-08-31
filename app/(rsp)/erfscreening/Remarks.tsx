import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { runListQuery } from '@/utils/query-result'
import type { ApplicantTypes, RemarksTypes } from '@/types'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import RemarkBox from './RemarkBox'
import RemarksList from './RemarksList'

interface ModalProps {
  document: ApplicantTypes
}

export default function Remarks({ document }: ModalProps) {
  //
  const [remarksData, setRemarksData] = useState<RemarksTypes[] | []>([])

  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  const fetchRemarks = async () => {
    // Fetch Document Replies
    const result = await runListQuery<RemarksTypes>(
      {
        transaction: 'Fetch applicant remarks',
        table: 'hrm_remarks',
        payload: { applicantId: document.id }
      },
      supabase
        .from('hrm_remarks')
        .select(
          '*,hrm_users:sender_id(firstname,middlename,lastname,avatar_url),hrm_remarks_comments(*, hrm_users:sender_id(firstname,middlename,lastname,avatar_url))'
        )
        .eq('applicant_id', document.id)
        .order('id', { ascending: false })
    )

    // A failed fetch used to dispatch null into redux, which renders exactly
    // like an applicant with no remarks.
    if (!result.ok) {
      setToast(
        'error',
        `Could not load the remarks on this applicant. ${result.error.message}`
      )
      return
    }

    const remarksData = result.data

    // Update remarks in redux
    dispatch(updateRemarksList(remarksData))
  }

  // Update remarks list whenever list in redux updates
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setRemarksData(globalremarks)
  }, [globalremarks])

  useEffect(() => {
    void fetchRemarks()
  }, [])

  return (
    <div className="w-full relative">
      <div className="mt-4 mx-2 mb-10 outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex space-x-2 px-4 py-4">
          <span className="font-bold">Remarks:</span>
        </div>
        {/* Only receiving department can make remarks */}
        {document.current_approver_id === session?.user.id && (
          <RemarkBox document={document} />
        )}
        {/* Added extra height if no remarks found */}
        {remarksData?.length === 0 && (
          <div className="h-20 px-4">No remarks found.&nbsp;</div>
        )}
        {remarksData?.map((reply, index) => (
          <RemarksList key={index} document={document} reply={reply} />
        ))}
      </div>
    </div>
  )
}
