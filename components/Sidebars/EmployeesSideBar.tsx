'use client'

import { Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const EmployeesSideBar = () => {
  const currentRoute = usePathname()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <Cog6ToothIcon className='w-4 h-4'/>
            <span>MANAGE EMPLOYEES</span>
          </div>
        </li>
        <li>
            <Link href="/employees" className={`app__menu_link ${currentRoute === '/employees' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Employees List</span>
            </Link>
        </li>
        <li>
            <Link href="/registrations" className={`app__menu_link ${currentRoute === '/registrations' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Registrations</span>
            </Link>
        </li>
      </ul>
    </>
  )
}

export default EmployeesSideBar
