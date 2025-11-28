/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import { TableCellsIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ReportsSidebar = () => {
  const currentRoute = usePathname()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <TableCellsIcon className="w-4 h-4" />
            <span>Reports</span>
          </div>
        </li>
        <li>
          <Link
            href="/reports"
            className={`app__menu_link ${
              currentRoute === '/reports' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Personnel</span>
          </Link>
        </li>
        <li>
          <Link
            href="/reports/requests"
            className={`app__menu_link ${
              currentRoute === '/reports/requests' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Requests</span>
          </Link>
        </li>
      </ul>
    </>
  )
}

export default ReportsSidebar
