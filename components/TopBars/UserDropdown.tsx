'use client'
import { Menu, Transition } from '@headlessui/react'
import { LockClosedIcon } from '@heroicons/react/24/solid'
import React, { Fragment, useState } from 'react'
import { useSupabase } from '@/context/SupabaseProvider'
import { useRouter } from 'next/navigation'
import Avatar from 'react-avatar'
import { AccountDetails } from '@/components'
import { Cog8ToothIcon, CreditCardIcon, PencilSquareIcon, TableCellsIcon, UserIcon } from '@heroicons/react/20/solid'

interface propTypes {
  darkMode?: boolean
}

const UserDropdown = ({ darkMode }: propTypes) => {
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false)

  const { supabase, session } = useSupabase()
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log({ error })
    }

    router.push('/')
  }

  return (
    <div className='pt-1'>
      <Menu as="div" className="relative inline-block text-left mr-2">
        <div>
          <Menu.Button className="relative focus:ring-0 focus:outline-none ">
            <Avatar round={true} size="33" name={session.user.email.split('@')[0]} />
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
          <Menu.Items className="absolute right-0 z-30 mt-2 origin-top-right rounded-md bg-gray-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                <div className='px-4 py-4'>
                  <div className='flex items-center space-x-2'>
                    <div className='text-sm font-semibold text-gray-700 whitespace-nowrap'>Manage Your Account</div>
                  </div>
                  <div className='py-4'>
                    <hr/>
                  </div>
                  <div
                    onClick={() => setShowAccountDetailsModal(true)}
                    className='app__user_menu_items'>
                    <UserIcon className='w-5 h-5'/>
                    <div className='text-sm font-semibold text-gray-700'>Account Details</div>
                  </div>
                  <div
                    // onClick={() => setShowAccountDetailsModal(true)}
                    className='app__user_menu_items'>
                    <TableCellsIcon className='w-5 h-5'/>
                    <div className='text-sm font-semibold text-gray-700 whitespace-nowrap'>Service Record</div>
                  </div>
                  <div
                    // onClick={() => setShowAccountDetailsModal(true)}
                    className='app__user_menu_items'>
                      <CreditCardIcon className='w-5 h-5'/>
                      <div className='text-sm font-semibold text-gray-700 whitespace-nowrap'>Leave Card</div>
                  </div>
                  <div
                    // onClick={() => setShowAccountDetailsModal(true)}
                    className='app__user_menu_items'>
                      <PencilSquareIcon className='w-5 h-5'/>
                      <div className='text-sm font-semibold text-gray-700 whitespace-nowrap'>PDS</div>
                    </div>
                  <div
                    // onClick={() => setShowAccountDetailsModal(true)}
                    className='app__user_menu_items'>
                      <PencilSquareIcon className='w-5 h-5'/>
                      <div className='text-sm font-semibold text-gray-700 whitespace-nowrap'>PDF</div>
                  </div>
                  <div
                    // onClick={() => setShowAccountDetailsModal(true)}
                    className='app__user_menu_items'>
                      <Cog8ToothIcon className='w-5 h-5'/>
                      <div className='text-sm font-semibold text-gray-700 whitespace-nowrap'>Login Settings</div>
                  </div>
                  <div className='py-4'>
                    <hr/>
                  </div>
                  <div
                    onClick={handleLogout}
                    className='app__user_menu_items'>
                    <LockClosedIcon className='w-5 h-5'/>
                    <button type="submit" className='text-sm font-semibold text-gray-700 whitespace-nowrap'>Logout</button>
                  </div>
                </div>
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Add/Edit Modal */}
      {
        showAccountDetailsModal && (
          <AccountDetails
            id={session.user.id}
            hideModal={() => setShowAccountDetailsModal(false)}/>
        )
      }

    </div>
  )
}
export default UserDropdown
