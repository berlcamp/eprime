import type { GlobalRemarksTypes } from '@/types'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import { useSupabase } from '@/context/SupabaseProvider'
import GlobalRemarksList from './GlobalRemarksList'
import GlobalRemarkBox from './GlobalRemarkBox'

interface ModalProps {
  referenceColumn: string
  referenceValue: string
}

export default function GlobalRemarks ({ referenceColumn, referenceValue }: ModalProps) {
  //
  const [remarksData, setRemarksData] = useState<GlobalRemarksTypes[] | []>([])

  const { supabase } = useSupabase()

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  const fetchRemarks = async () => {
    let query = supabase
      .from('hrm_global_remarks')
      .select('*,hrm_users:sender_id(firstname,middlename,lastname,avatar_url),hrm_remarks_comments(*, hrm_users:sender_id(firstname,middlename,lastname,avatar_url))')
      .eq(referenceColumn, referenceValue)

    query = query.order('id', { ascending: false })

    const { data: remarksData } = await query

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
    <div className='w-full relative'>
      <div className='mt-4 mx-2 mb-10 outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'>
        <div className='flex space-x-2 px-4 py-4'>
          <span className='font-bold'>Remarks:</span>
        </div>
        <GlobalRemarkBox referenceColumn={referenceColumn} referenceValue={referenceValue}/>
        {/* Added extra height if no remarks found */}
        {
          remarksData?.length === 0 && <div className='h-20 px-4'>No remarks found.&nbsp;</div>
        }
        {
          remarksData?.map((reply, index) => (
            <GlobalRemarksList
              key={index}
              reply={reply}/>
          ))
        }
      </div>
    </div>
  )
}
