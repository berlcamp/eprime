'use client'
import { useFilter } from '@/context/FilterContext'
import { ChartBarSquareIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const RandRSidebar = () => {
  const { hasAccess } = useFilter()

  const currentRoute = usePathname()

  const hasAccessSettings = hasAccess('randr_manager')

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <ChartBarSquareIcon className="w-4 h-4" />
            <span>My R&R</span>
          </div>
        </li>
        <li>
          <Link
            href="/randr"
            className={`app__menu_link ${
              currentRoute === '/randr' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">HOME</span>
          </Link>
        </li>
        <li>
          <Link
            href="/randr/myrr"
            className={`app__menu_link ${
              currentRoute === '/pms/myrr' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Rewards & Recognation
            </span>
          </Link>
        </li>
      </ul>
      {hasAccessSettings && (
        <>
          <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
                <Cog6ToothIcon className="w-4 h-4" />
                <span>SETTINGS</span>
              </div>
            </li>
            <li>
              <Link
                href="/randr/ranking"
                className={`app__menu_link ${
                  currentRoute === '/randr/ranking'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  R&R Ranking
                </span>
              </Link>
            </li>
          </ul>
        </>
      )}
    </>
  )
}

export default RandRSidebar
