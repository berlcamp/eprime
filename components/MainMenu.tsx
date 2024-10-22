/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { Office, SchoolTypes } from '@/types'
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  TableCellsIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/20/solid'
import Link from 'next/link'
import { MdOutlineMoreTime } from 'react-icons/md'

const MainMenu = () => {
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
    <div className="py-1 relative">
      <div className="px-6 mt-2 text-gray-700 text-xl font-semibold">Menu</div>
      <div className="px-4 py-2 overflow-y-auto h-[calc(100vh-170px)]">
        <div className="lg:flex lg:space-x-2 lg:space-y-0 space-y-2 justify-center lg:flex-row-reverse">
          <div className="px-2 py-4 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col lg:mx-2 space-y-1">
            <div className="text-gray-700 text-lg font-semibold">Shortcuts</div>
            <Link
              href={`/profile/${session.user.id}?page=requests`}
              className="app__menu_item"
            >
              <CalendarDaysIcon className="w-6 h-6" />
              <div className="app__menu_item_label">My Requests</div>
            </Link>
            <Link
              href={`/profile/${session.user.id}?page=leavecard`}
              className="app__menu_item"
            >
              <TableCellsIcon className="w-6 h-6" />
              <div className="app__menu_item_label">My Leave Card</div>
            </Link>
            <Link
              href={`/profile/${session.user.id}?page=servicerecords`}
              className="app__menu_item"
            >
              <TableCellsIcon className="w-6 h-6" />
              <div className="app__menu_item_label">My Service Records</div>
            </Link>
            <Link
              href={`/profile/${session.user.id}?page=ctos`}
              className="app__menu_item"
            >
              <MdOutlineMoreTime className="w-6 h-6" />
              <div className="app__menu_item_label">My CTO&apos;s</div>
            </Link>
            <Link
              href={`/profile/${session.user.id}?page=servicecredits`}
              className="app__menu_item"
            >
              <CalendarIcon className="w-6 h-6" />
              <div className="app__menu_item_label">My Service Credits</div>
            </Link>
          </div>
          <div className="px-2 py-4 lg:w-96 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col space-y-2">
            <div className="text-gray-700 text-lg font-semibold">
              Human Resource
            </div>
            <Link href="/">
              <div className="app__menu_item">
                <div className="pt-1">
                  <HomeIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">Home</div>
                  <div className="app__menu_item_label_description">
                    Go to home page.
                  </div>
                </div>
              </div>
            </Link>
            {(schools.length > 0 || offices.length > 0) && (
              <Link href="/personnels">
                <div className="app__menu_item">
                  <div className="pt-1">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="app__menu_item_label">Personnel</div>
                    <div className="app__menu_item_label_description">
                      School/Office Personnels under your supervision
                    </div>
                  </div>
                </div>
              </Link>
            )}
            <Link href="/tracker">
              <div className="app__menu_item">
                <div className="pt-1">
                  <DocumentDuplicateIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">Request Tracker</div>
                  <div className="app__menu_item_label_description">
                    Leave, Travel Authority, Pass slip, Undertime Permit,
                    Locator Slip.
                  </div>
                </div>
              </div>
            </Link>
            {(hasAccess('employee_accounts') ||
              hasAccess('records') ||
              hasAccess('sds') ||
              hasAccess('asds') ||
              hasAccess('certify_leave_credits')) && (
              <>
                <Link href="/employees">
                  <div className="app__menu_item">
                    <div className="pt-1">
                      <UsersIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="app__menu_item_label">
                        Records & Credits
                      </div>
                      <div className="app__menu_item_label_description">
                        Employees, Service Records, Assignments, Designations,
                        CTO, Service Credits, Promotions, Plantillas, NOSI/NOSA.
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/reports">
                  <div className="app__menu_item">
                    <div className="pt-1">
                      <ChartBarIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="app__menu_item_label">Reports</div>
                      <div className="app__menu_item_label_description">
                        HR Reports
                      </div>
                    </div>
                  </div>
                </Link>
              </>
            )}
            <div className="pt-4">
              <hr />
            </div>
            <div className="text-gray-700 text-lg font-semibold">PRIME</div>
            <Link href="/ranking">
              <div className="app__menu_item">
                <div className="pt-1">
                  <UsersIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">R/S/P</div>
                  <div className="app__menu_item_label_description">
                    Recruitment, selection, and placement.
                  </div>
                </div>
              </div>
            </Link>
            <Link href="#">
              <div className="app__menu_item">
                <div className="pt-1">
                  <ChartBarSquareIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">
                    Performance Mgmt System
                  </div>
                  <div className="app__menu_item_label_description">
                    Ipcrf/opcrf, development plans.
                  </div>
                </div>
              </div>
            </Link>
            <Link href="#">
              <div className="app__menu_item">
                <div className="pt-1">
                  <BookOpenIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">Learning & Devt</div>
                  <div className="app__menu_item_label_description">
                    Development plans and trainings.{' '}
                  </div>
                </div>
              </div>
            </Link>
            <Link href="#">
              <div className="app__menu_item">
                <div className="pt-1">
                  <TrophyIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="app__menu_item_label">
                    Rewards & Recognation
                  </div>
                  <div className="app__menu_item_label_description">
                    Pasidungog, loyalty, tribute to retirees, gawad agad.
                  </div>
                </div>
              </div>
            </Link>
            <div className="pt-4">
              <hr />
            </div>
            {hasAccess('settings') && (
              <>
                <div className="text-gray-700 text-lg font-semibold">
                  System
                </div>
                <Link href="/settings/system">
                  <div className="app__menu_item">
                    <div className="pt-1">
                      <UsersIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="app__menu_item_label">
                        System Settings
                      </div>
                      <div className="app__menu_item_label_description">
                        System Access, Schools, Districts, Positions.{' '}
                      </div>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default MainMenu
