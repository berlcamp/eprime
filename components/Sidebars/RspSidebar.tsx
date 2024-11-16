/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import { useFilter } from '@/context/FilterContext'
import { TableCellsIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const RspSidebar = () => {
  const currentRoute = usePathname()

  const { hasAccess } = useFilter()

  return (
    <>
      {
        // Check access from permission settings
        hasAccess('rsp_manager') && (
          <ul className="pt-8 mt-4 space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
                <TableCellsIcon className="w-4 h-4" />
                <span>Recuitment</span>
              </div>
            </li>
            <li>
              <Link
                href="/applicants"
                className={`app__menu_link ${
                  currentRoute === '/applicants' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Applicants
                </span>
              </Link>
            </li>
          </ul>
        )
      }
      <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <TableCellsIcon className="w-4 h-4" />
            <span>Selection</span>
          </div>
        </li>
        <li>
          <Link
            href="/ranking"
            className={`app__menu_link ${
              currentRoute === '/ranking' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Ranking</span>
          </Link>
        </li>
      </ul>
      {
        // Check access from permission settings
        hasAccess('rsp_manager') && (
          <>
            <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
              <li>
                <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
                  <TableCellsIcon className="w-4 h-4" />
                  <span>Placement</span>
                </div>
              </li>
              <li>
                <Link
                  href="/rankingresults"
                  className={`app__menu_link ${
                    currentRoute === '/rankingresults'
                      ? 'app_menu_link_active'
                      : ''
                  }`}
                >
                  <span className="flex-1 ml-3 whitespace-nowrap">
                    Ranking Results
                  </span>
                </Link>
              </li>
            </ul>
            <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
              <li>
                <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
                  <TableCellsIcon className="w-4 h-4" />
                  <span>Reports</span>
                </div>
              </li>
              <li>
                <Link
                  href="/rankingturnaroundtime"
                  className={`app__menu_link ${
                    currentRoute === '/rankingturnaroundtime'
                      ? 'app_menu_link_active'
                      : ''
                  }`}
                >
                  <span className="flex-1 ml-3 whitespace-nowrap">
                    Turn Around TIme
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/rankingexpensessummary"
                  className={`app__menu_link ${
                    currentRoute === '/rankingexpensessummary'
                      ? 'app_menu_link_active'
                      : ''
                  }`}
                >
                  <span className="flex-1 ml-3 whitespace-nowrap">
                    Expenses Summary
                  </span>
                </Link>
              </li>
            </ul>
          </>
        )
      }
    </>
  )
}

export default RspSidebar
