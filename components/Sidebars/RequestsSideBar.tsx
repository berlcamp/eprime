import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import { TableCellsIcon } from '@heroicons/react/20/solid'

const RequestsSideBar = () => {
  const currentRoute = usePathname()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <TableCellsIcon className='w-4 h-4'/>
            <span>My Requests</span>
          </div>
        </li>
        <li>
            <Link
              href="/myleaverequests"
              className={`app__menu_link ${currentRoute === '/myleaverequests' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Leave Requests</span>
            </Link>
        </li>
        <li>
            <Link
              href="/travelrequests"
              className={`app__menu_link ${currentRoute === '/travelrequests' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Travel Authorities</span>
            </Link>
        </li>
        <li>
            <Link
              href="/passslips"
              className={`app__menu_link ${currentRoute === '/passslips' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Pass Slips</span>
            </Link>
        </li>
      </ul>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <TableCellsIcon className='w-4 h-4'/>
            <span>HR Records</span>
          </div>
        </li>
        <li>
            <Link
              href="/leaverequests"
              className={`app__menu_link ${currentRoute === '/leaverequests' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Leave Requests</span>
            </Link>
        </li>
        <li>
            <Link
              href="/travelrequests"
              className={`app__menu_link ${currentRoute === '/travelrequests' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Travel Authorities</span>
            </Link>
        </li>
        <li>
            <Link
              href="/passslips"
              className={`app__menu_link ${currentRoute === '/passslips' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Pass Slips</span>
            </Link>
        </li>
      </ul>
    </>
  )
}

export default RequestsSideBar
