'use client'
import { Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const RandRSidebar = () => {
  const currentRoute = usePathname()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Rewards & Recognition</span>
          </div>
        </li>
        <li>
          <Link
            href="/randr/ranking"
            className={`app__menu_link ${
              currentRoute === '/randr/ranking' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Pasidungog</span>
          </Link>
        </li>
        <li>
          <Link
            href="/randr/serviceawards"
            className={`app__menu_link ${
              currentRoute === '/randr/serviceawards'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Service Awards
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/randr/gawadagad"
            className={`app__menu_link ${
              currentRoute === '/randr/gawadagad' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Gawad Agad</span>
          </Link>
        </li>
        <li>
          <Link
            href="/randr/meritorious"
            className={`app__menu_link ${
              currentRoute === '/randr/meritorious'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Meritorious Award
            </span>
          </Link>
        </li>
      </ul>
    </>
  )
}

export default RandRSidebar
