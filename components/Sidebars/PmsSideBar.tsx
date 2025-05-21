'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Office, SchoolTypes } from '@/types'
import { ChartBarSquareIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PmsSideBar = () => {
  const { hasAccess } = useFilter()
  const {
    systemSchools,
    systemOffices,
    session
  }: { systemSchools: SchoolTypes[]; systemOffices: Office[]; session: any } =
    useSupabase()

  const currentRoute = usePathname()

  const isHead = systemSchools.find(
    (school) => school.head_user_id === session?.user.id
  )
    ? true
    : false

  const isOfficeHead = systemOffices.find(
    (office) => office.head_user_id === session?.user.id
  )
    ? true
    : false

  console.log('isOfficeHead', isOfficeHead)

  const hasAccessPmsSettings = hasAccess('pms_manager')

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <ChartBarSquareIcon className="w-4 h-4" />
            <span>My PMS</span>
          </div>
        </li>
        <li>
          <Link
            href="/pms"
            className={`app__menu_link ${
              currentRoute === '/pms' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">HOME</span>
          </Link>
        </li>
        <li>
          <Link
            href="/pms/ipcrf"
            className={`app__menu_link ${
              currentRoute === '/pms/ipcrf' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">IPCRF</span>
          </Link>
        </li>
        {isHead && (
          <Link
            href="/pms/opcrf"
            className={`app__menu_link ${
              currentRoute === '/pms/opcrf' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              OPCRF{' '}
              <sup className="text-xs font-bold text-red-500">
                (School Head)
              </sup>
            </span>
          </Link>
        )}
        {(hasAccess('sds') || hasAccess('cid') || hasAccess('sgod')) && (
          <li>
            <Link
              href="/pms/chiefsopcrf"
              className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700"
            >
              <span className="flex-1 ml-3 whitespace-nowrap">
                OPCRF{' '}
                <sup className="text-xs font-bold text-red-500">(Chiefs)</sup>
              </span>
            </Link>
          </li>
        )}
      </ul>
      {hasAccessPmsSettings && (
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
                href="/pms/kras"
                className={`app__menu_link ${
                  currentRoute === '/pms/kras' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">Domains</span>
              </Link>
            </li>
            <li>
              <Link
                href="/pms/objectives"
                className={`app__menu_link ${
                  currentRoute === '/pms/objectives'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  KRA/Domain Objectives
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/pms/competencies"
                className={`app__menu_link ${
                  currentRoute === '/pms/competencies'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Competencies
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/pms/ipcrftemplates"
                className={`app__menu_link ${
                  currentRoute === '/pms/ipcrftemplates'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  IPCRF/OPCRF Templates
                </span>
              </Link>
            </li>
          </ul>
        </>
      )}
    </>
  )
}

export default PmsSideBar
