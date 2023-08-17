'use client'
import React, { Fragment, useEffect, useState } from 'react'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import { Menu, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import uuid from 'react-uuid'
import { useSupabase } from '@/context/SupabaseProvider'

import type { NotificationTypes } from '@/types'

interface propTypes {
  darkMode?: boolean
}

const Notifications = ({ darkMode }: propTypes) => {
  const router = useRouter()
  const { supabase, session } = useSupabase()

  const [list, setList] = useState<NotificationTypes[] | null>(null)
  const [count, setCount] = useState(0)

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select()
      .eq('user_id', session.user.id)
      .order('is_read', 'desc')
      .order('id', 'desc')
      .limit(20)

    if (error) console.error(error)

    void countUnread()
    setList(data)
  }

  const countUnread = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .eq('user_id', session.user.id)

    setCount(count)
  }

  // Mark as read
  const handleClick = async (notification: NotificationTypes) => {
    // mark as read code here..
    await supabase
      .from('hrm_notifications')
      .update({
        is_read: true
      })
      .eq('id', notification.id)

    void countUnread()

    router.push(notification.url)
  }

  const handleToggleOpen = () => {
    void fetchData()
  }

  useEffect(() => {
    void countUnread()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='pt-1 cursor-pointer'>
      <Menu as="div" className="relative inline-block text-left mr-2">
        <div>
          <Menu.Button className="relative focus:ring-0 focus:outline-none ">
            <span className={`inline-flex items-center justify-center rounded-full ${darkMode ? 'bg-white' : 'bg-gray-500 bg-opacity-30'} w-8 h-8`}>
              <span className='absolute z-30 top-0 -right-2 bg-red-500 rounded-full px-1 text-white text-[8px]'>{count}</span>
              <BellAlertIcon onClick={handleToggleOpen} className='w-6 h-6 text-gray-700 dark:text-gray-200'/>
            </span>
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
          <Menu.Items className="absolute right-0 z-30 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {
                list?.map((notification: NotificationTypes) => (
                  <Menu.Item key={uuid()}>
                    <div
                      onClick={async () => await handleClick(notification)}
                      className='flex items-start space-x-2 cursor-pointer hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-4 py-2 text-xs'>
                      <span>{ notification.message }</span>
                      {
                        !notification.is_read && <span className='text-red-700 font-medium text-xs'>[New!]</span>
                      }
                    </div>
                  </Menu.Item>
                ))
              }
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
export default Notifications
