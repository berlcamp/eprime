/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Office, SchoolTypes } from '@/types'
import { Cog6ToothIcon, TableCellsIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LandDSidebar = () => {
  const currentRoute = usePathname()

  const { hasAccess } = useFilter()
  const {
    systemSchools,
    systemOffices,
    session
  }: { systemSchools: SchoolTypes[]; systemOffices: Office[]; session: any } =
    useSupabase()

  let schools: SchoolTypes[] = []
  let offices: Office[] = []
  if (hasAccess('sds') || hasAccess('asds')) {
    schools = systemSchools
    offices = systemOffices
  } else {
    schools = systemSchools.filter(
      (school) => school.head_user_id === session.user.id
    )
    offices = systemOffices.filter(
      (office) => office.head_user_id === session.user.id
    )
  }

  return (
    <>
      {(schools.length > 0 || offices.length > 0) && (
        <ul className="pt-8 mt-4 space-y-2 border-gray-700">
          <li>
            <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
              <TableCellsIcon className="w-4 h-4" />
              <span>Personnel</span>
            </div>
          </li>
          <li>
            <Link
              href="/landd/schoolpersonnels"
              className={`app__menu_link ${
                currentRoute === '/landd/schoolpersonnels'
                  ? 'app_menu_link_active'
                  : ''
              }`}
            >
              <span className="flex-1 ml-3 whitespace-nowrap">
                School Personnel
              </span>
            </Link>
          </li>
          {hasAccess('landd_hrd')}
          <li>
            <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
              <Cog6ToothIcon className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </li>
          <li>
            <Link
              href="/landd/settings/interventions"
              className={`app__menu_link ${
                currentRoute === '/landd/settings/interventions'
                  ? 'app_menu_link_active'
                  : ''
              }`}
            >
              <span className="flex-1 ml-3 whitespace-nowrap">
                Interventions
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/landd/settings/system"
              className={`app__menu_link ${
                currentRoute === '/landd/settings/system'
                  ? 'app_menu_link_active'
                  : ''
              }`}
            >
              <span className="flex-1 ml-3 whitespace-nowrap">
                L&D System Permissions
              </span>
            </Link>
          </li>
        </ul>
      )}
    </>
  )
}

export default LandDSidebar
