/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'
import { AccountDetails } from '@/components/index'
import { useSupabase } from '@/context/SupabaseProvider'
import { Menu, Transition } from '@headlessui/react'
import { UserIcon } from '@heroicons/react/20/solid'
import { LockClosedIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import Avatar from 'react-avatar'

// types
import type { Employee } from '@/types'
import Link from 'next/link'
import { GrDocumentUser } from 'react-icons/gr'

const UserDropdown = () => {
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false)

  const { supabase, session, systemUsers } = useSupabase()
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log({ error })
    } else {
      router.refresh()
      router.push('/')
    }
  }

  const user: Employee = systemUsers.find(
    (u: { id: string }) => u.id === session.user.id
  )

  return (
    <div className="pt-1">
      <Menu as="div" className="relative inline-block text-left mr-2">
        <div>
          <Menu.Button className="relative focus:ring-0 focus:outline-none ">
            {user.avatar_url && user.avatar_url !== '' ? (
              <div className="w-8 h-8 relative rounded-full flex items-center justify-center bg-black overflow-hidden">
                <Image
                  src={user.avatar_url}
                  width={40}
                  height={40}
                  alt="user"
                />
              </div>
            ) : (
              <Avatar round={true} size="30" name={user.firstname} />
            )}
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
                <div className="px-4 py-2">
                  <Link
                    href={`/profile/${session.user.id}`}
                    className="app__user_menu_items"
                  >
                    <UserIcon className="w-5 h-5" />
                    <div className="text-sm font-semibold text-gray-700">
                      My Profile
                    </div>
                  </Link>
                  <div
                    onClick={() => setShowAccountDetailsModal(true)}
                    className="app__user_menu_items"
                  >
                    <GrDocumentUser className="w-5 h-5" />
                    <div className="text-sm font-semibold text-gray-700">
                      Account Details
                    </div>
                  </div>
                  <div className="py-2">
                    <hr />
                  </div>
                  <div onClick={handleLogout} className="app__user_menu_items">
                    <LockClosedIcon className="w-5 h-5" />
                    <button
                      type="submit"
                      className="text-sm font-semibold text-gray-700 whitespace-nowrap"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Add/Edit Modal */}
      {showAccountDetailsModal && (
        <AccountDetails
          id={session.user.id}
          shouldUpdateRedux={false}
          hideModal={() => setShowAccountDetailsModal(false)}
        />
      )}
    </div>
  )
}
export default UserDropdown
