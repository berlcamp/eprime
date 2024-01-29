/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import { Menu, Transition } from '@headlessui/react'
import { EyeIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useState } from 'react'
// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'
import type { Employee } from '@/types'

interface ModalProps {
  referenceColumn: string
  referenceValue: string
}

export default function GlobalRemarkBox ({ referenceColumn, referenceValue }: ModalProps) {
  const { supabase, session, systemUsers } = useSupabase()
  const { setToast } = useFilter()
  const [saving, setSaving] = useState(false)

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  const user: Employee = systemUsers.find((u: { id: string }) => u.id === session.user.id)

  const [replyType, setReplyType] = useState('Public')
  const [remarks, setRemarks] = useState('')

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
        message: remarks,
        is_private: replyType === 'Private Note'
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
      dispatch(updateRemarksList([updatedData, ...globalremarks]))

      setRemarks('')

      setSaving(false)

      // pop up the success message
      setToast('success', 'Remarks successfully added.')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className='w-full flex-col space-y-2 px-4 mb-5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
      <textarea
        onChange={e => setRemarks(e.target.value)}
        value={remarks}
        disabled={saving}
        placeholder='Write your remarks here..'
        className='w-full h-20 border resize-none focus:ring-0 focus:outline-none p-2 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'></textarea>
      <div className='flex items-start'>

        {/* Public/Private */}
        <div className='flex items-center px-2'>
          <Menu as="div" className="relative inline-block text-left mr-2">
            <Menu.Button className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
              <EyeIcon className="w-4 h-4 mr-1"/>
              { replyType }
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-50 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    <div
                        onClick={e => setReplyType('Public')}
                        className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                      >
                        <span>Public</span>
                    </div>
                  </Menu.Item>
                  <Menu.Item>
                    <div
                        onClick={e => setReplyType('Private Note')}
                        className='flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer'
                      >
                        <span>Private Note</span>
                    </div>
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        {/* End - Public/Private */}

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
  )
}
