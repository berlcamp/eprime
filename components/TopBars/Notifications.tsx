/* eslint-disable react-hooks/exhaustive-deps */
'use client'
import React, { Fragment, useEffect, useState } from 'react'
import { BellAlertIcon } from '@heroicons/react/24/solid'
import { Menu, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import uuid from 'react-uuid'
import { useSupabase } from '@/context/SupabaseProvider'

import type { NotificationTypes } from '@/types'
// import Link from 'next/link'

interface propTypes {
  darkMode?: boolean
}

const Notifications = ({ darkMode }: propTypes) => {
  const router = useRouter()
  const { supabase, session } = useSupabase()

  const userId: string = session.user.id

  const [list, setList] = useState<NotificationTypes[] | null>(null)
  const [count, setCount] = useState(0)

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('hrm_notifications')
      .select()
      .eq('user_id', userId)
      .order('is_read', 'desc')
      .order('id', 'desc')
      .limit(20)

    if (error) console.error(error)

    void countUnread()
    setList(data)
  }

  const countUnread = async () => {
    const { count } = await supabase
      .from('hrm_notifications')
      .select('*', { count: 'exact' })
      .eq('is_read', false)
      .eq('user_id', userId)

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

  useEffect(() => {
    void fetchData()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('realtime notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hrm_notifications', filter: `user_id=eq.${userId}` },
        () => {
          void fetchData()
        })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className='pt-1 cursor-pointer'>
      <Menu as="div" className="relative inline-block text-left mr-2">
        <div>
          <Menu.Button className="relative focus:ring-0 focus:outline-none ">
            <span className={`inline-flex items-center justify-center rounded-full ${darkMode ? 'bg-white' : 'bg-gray-500 bg-opacity-30'} w-8 h-8`}>
              <span className='absolute z-30 top-0 -right-2 bg-red-500 rounded-full px-1 text-white text-[8px]'>{count}</span>
              <BellAlertIcon className='w-6 h-6 text-gray-700 dark:text-gray-200'/>
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
                      className='hover:bg-gray-100 text-gray-700 hover:text-gray-900 mx-2 p-2 text-xs'>
                      <div className='flex items-start justify-between space-x-2 text-gray-800'>
                        <span dangerouslySetInnerHTML={{ __html: notification.message }}/>
                        {
                          !notification.is_read && <span className='text-red-700 font-medium text-xs'>[New!]</span>
                        }
                      </div>
                      <div className='text-blue-700'>1 hour ago</div>
                    </div>
                  </Menu.Item>
                ))
              }
              {
                list?.length === 0 && <Menu.Item><div className='text-sm p-2 text-gray-500'>No notifications found.</div></Menu.Item>
              }
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
export default Notifications
