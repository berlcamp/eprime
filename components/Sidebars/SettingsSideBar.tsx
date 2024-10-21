import { useSupabase } from '@/context/SupabaseProvider'
import { Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SettingsSideBar = () => {
  const currentRoute = usePathname()

  const { session } = useSupabase()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <Cog6ToothIcon className="w-4 h-4" />
            <span>System Settings</span>
          </div>
        </li>
        <li>
          <Link
            href="/settings/schools"
            className={`app__menu_link ${
              currentRoute === '/settings/schools' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Schools</span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/districts"
            className={`app__menu_link ${
              currentRoute === '/settings/districts'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Districts</span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/offices"
            className={`app__menu_link ${
              currentRoute === '/settings/offices' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Division Offices
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/positions"
            className={`app__menu_link ${
              currentRoute === '/settings/positions'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Positions</span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/implementingunits"
            className={`app__menu_link ${
              currentRoute === '/settings/implementingunits'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Plantilla Implementing Units
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/settings/salaries"
            className={`app__menu_link ${
              currentRoute === '/settings/salaries'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Salary Grades</span>
          </Link>
        </li>
      </ul>
      <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Permissions</span>
          </div>
        </li>
        <li>
          <Link
            href="/settings/system"
            className={`app__menu_link ${
              currentRoute === '/settings/system' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">System Access</span>
          </Link>
        </li>
        {session.user.email === 'berlcamp@gmail.com' && (
          <li>
            <Link
              href="/settings/errorlogs"
              className={`app__menu_link ${
                currentRoute === '/settings/errorlogs'
                  ? 'app_menu_link_active'
                  : ''
              }`}
            >
              <span className="flex-1 ml-3 whitespace-nowrap">Error Logs</span>
            </Link>
          </li>
        )}
      </ul>
    </>
  )
}

export default SettingsSideBar
