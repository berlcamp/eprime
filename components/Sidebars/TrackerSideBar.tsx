'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const TrackerSideBar = () => {
  const [forwardedCount, setForwardedCount] = useState(0)
  const [myRequestCount, setMyRequestCount] = useState(0)

  const searchParams = useSearchParams()

  const filter = searchParams.get('filter')

  const { supabase, session } = useSupabase()

  // Redux staff
  const recountStatus = useSelector((state: any) => state.recount.value)

  const counter = async () => {
    const { count: forwarded }: { count: number } = await supabase
      .from('hrm_request_trackers')
      .select('id', { count: 'exact' })
      .eq('receiver_id', session.user.id)
      .eq('current_tracker', 'Forwarded')
      .neq('current_status', 'Approved')
      .neq('current_status', 'Cancelled')
      .neq('current_status', 'Disapproved')

    const { count: myReq }: { count: number } = await supabase
      .from('hrm_request_trackers')
      .select('id', { count: 'exact' })
      .eq('created_by', session.user.id)

    setMyRequestCount(myReq)
    setForwardedCount(forwarded)
  }
  useEffect(() => {
    void counter()
  }, [recountStatus])
  return (
    <>
      <ul className="pt-8 mt-6 space-y-2 border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <span>Request Tracker</span>
          </div>
        </li>
        <li>
          <Link
            href="/tracker?filter=search"
            className={`app__menu_link ${
              filter === 'search' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex space-x-2 flex-1 ml-3 whitespace-nowrap">
              <SearchIcon className="w-4 h-4" /> <span>Search Requests</span>
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/tracker"
            className={`app__menu_link ${
              !filter ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">My Requests</span>
            {myRequestCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5">
                <span className="rounded-full px-1 text-white text-xs">
                  {myRequestCount}
                </span>
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link
            href="/tracker?filter=forwarded"
            className={`app__menu_link ${
              filter === 'forwarded' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Forwarded To Me
            </span>
            {forwardedCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-5 h-5">
                <span className="rounded-full px-1 text-white text-xs">
                  {forwardedCount}
                </span>
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link
            href="/tracker?filter=following"
            className={`app__menu_link ${
              filter === 'following' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Followed</span>
          </Link>
        </li>
      </ul>
    </>
  )
}

export default TrackerSideBar
