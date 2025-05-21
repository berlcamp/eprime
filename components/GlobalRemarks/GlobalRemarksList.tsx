/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import ConfirmModal from '@/components/ConfirmModal'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import type { GlobalRemarksTypes } from '@/types'
import { Menu, Transition } from '@headlessui/react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import Image from 'next/image'
import { Fragment, useState } from 'react'
import Avatar from 'react-avatar'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  reply: GlobalRemarksTypes
}

export default function GlobalRemarksList({ reply }: ModalProps) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  // Delete confirmation
  const deleteReply = (id: string) => {
    setShowConfirmation(true)
    setSelectedId(id)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedId('')
  }
  const handleConfirm = async () => {
    await handleDeleteReply()
    setShowConfirmation(false)
  }

  const handleDeleteReply = async () => {
    try {
      const { error } = await supabase
        .from('hrm_global_remarks')
        .delete()
        .eq('id', selectedId)

      if (error) throw new Error(error.message)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      // Remove remarks from redux
      const items = [...globalremarks]
      const updatedData = items.filter((item) => item.id !== selectedId)
      dispatch(updateRemarksList(updatedData))
    } catch (e) {
      console.error(e)
    }
  }

  // Only enable Edit/delete to author
  const isAuthor = reply.sender_id === session?.user.id

  return (
    <div className="w-full pb-12 flex-col space-y-1 px-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <div className="w-full group">
        <div className="flex items-center space-x-2">
          <div className="flex flex-1 items-center space-x-2">
            {reply.hrm_users.avatar_url !== null ? (
              <div className="relative flex items-center justify-center bg-black overflow-hidden">
                <Image
                  src={reply.hrm_users?.avatar_url}
                  width={30}
                  height={30}
                  alt="user"
                />
              </div>
            ) : (
              <Avatar
                round={false}
                size="30"
                name={reply.hrm_users.firstname}
              />
            )}
            <div>
              <div className="font-bold">
                <span>
                  {reply.hrm_users.firstname} {reply.hrm_users.middlename}{' '}
                  {reply.hrm_users.lastname}:{' '}
                </span>
              </div>
              <div className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                {format(new Date(reply.created_at), 'dd MMM yyyy h:mm a')}
              </div>
            </div>
          </div>
          <div
            className={`${
              isAuthor ? 'group-hover:flex' : 'hidden'
            } items-center space-x-2`}
          >
            <Menu as="div" className="relative inline-block text-left mr-2">
              <div>
                <Menu.Button className="text-gray-500  focus:ring-0 focus:outline-none text-xs text-left inline-flex items-center">
                  <EllipsisHorizontalIcon className="w-6 h-6" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-50 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      <div
                        onClick={() => deleteReply(reply.id)}
                        className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs cursor-pointer"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete</span>
                      </div>
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        <div className="ml-12">
          {/* Message */}
          <div className="mt-1">
            <div className="mt-2">
              <span>{reply.message}</span>
            </div>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <ConfirmModal
          btnText="Yes"
          header="Confirmation"
          message="Are you sure you want to perform this action?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
