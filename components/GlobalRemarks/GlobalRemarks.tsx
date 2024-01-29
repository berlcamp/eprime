import type { Employee, GlobalRemarksTypes } from '@/types'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/context/SupabaseProvider'
import GlobalRemarksList from './GlobalRemarksList'
import { useFilter } from '@/context/FilterContext'
import CustomButton from '../CustomButton'

interface ModalProps {
  referenceColumn: string
  referenceValue: string
}

export default function GlobalRemarks ({ referenceColumn, referenceValue }: ModalProps) {
  //
  const [remarksData, setRemarksData] = useState<GlobalRemarksTypes[] | []>([])
  const [saving, setSaving] = useState(false)

  const [remarks, setRemarks] = useState('')

  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()

  const user: Employee = systemUsers.find((u: { id: string }) => u.id === session.user.id)

  const fetchRemarks = async () => {
    const { data } = await supabase
      .from('hrm_global_remarks')
      .select('*,hrm_users:sender_id(firstname,middlename,lastname,avatar_url)')
      .eq('promotion_id', referenceValue)
      .order('id', { ascending: false })

    if (data) setRemarksData(data)
  }

  const handleSubmit = async () => {
    if (saving) return

    if (remarks.trim() === '') {
      setRemarks('')
      setToast('error', 'Please write remarks')
      return
    }

    setSaving(true)

    //
    try {
      const newData = {
        [referenceColumn]: referenceValue,
        sender_id: session.user.id,
        message: remarks
      }

      // Insert into replies database table
      const { data, error } = await supabase
        .from('hrm_global_remarks')
        .insert(newData)
        .select()

      if (error) {
        console.error('naai error', error)
        return
      }

      // Append new remarks to remarks redux
      const updatedData = { id: data[0].id, hrm_users: user, created_at: data[0].created_at, ...newData }
      setRemarksData([updatedData, ...remarksData])

      setRemarks('')

      setSaving(false)

      // pop up the success message
      setToast('success', 'Remarks successfully added.')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    void fetchRemarks()
  }, [])

  return (
    <div className='w-full relative'>
      <div className='mt-4 mx-2 mb-10 outline-none overflow-x-hidden overflow-y-auto text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'>
        <div className='flex space-x-2 px-4 py-4'>
          <span className='font-bold'>Remarks:</span>
        </div>
        <div className='w-full flex-col space-y-2 px-4 mb-5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
          <textarea
            onChange={e => setRemarks(e.target.value)}
            value={remarks}
            disabled={saving}
            placeholder='Write your remarks here..'
            className='w-full h-20 border resize-none focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'/>
          <div className='flex items-start'>
            <span className='flex-1'>&nbsp;</span>

            <CustomButton
              containerStyles='app__btn_green'
              title={saving ? 'Saving...' : 'Submit'}
              isDisabled={saving}
              btnType='button'
              handleClick={handleSubmit}
            />
          </div>
        </div>
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
