import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import { TableCellsIcon } from '@heroicons/react/20/solid'

const RecordsSideBar = () => {
  const currentRoute = usePathname()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <TableCellsIcon className='w-4 h-4'/>
            <span>My Records</span>
          </div>
        </li>
        <li>
            <Link
              href="/myservicerecords"
              className={`app__menu_link ${currentRoute === '/myservicerecords' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Service Records</span>
            </Link>
        </li>
        <li>
            <Link
              href="/myctos"
              className={`app__menu_link ${currentRoute === '/myctos' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">CTOs</span>
            </Link>
        </li>
        <li>
            <Link
              href="/myservicecredits"
              className={`app__menu_link ${currentRoute === '/myservicecredits' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Service Credits</span>
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
              href="/assignments"
              className={`app__menu_link ${currentRoute === '/assignments' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Assignments</span>
            </Link>
        </li>
        <li>
            <Link
              href="/designations"
              className={`app__menu_link ${currentRoute === '/designations' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Designations</span>
            </Link>
        </li>
        <li>
            <Link
              href="/ctos"
              className={`app__menu_link ${currentRoute === '/ctos' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">CTO</span>
            </Link>
        </li>
        <li>
            <Link
              href="/servicecredits"
              className={`app__menu_link ${currentRoute === '/servicecredits' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Service Credits</span>
            </Link>
        </li>
        <li>
            <Link
              href="/promotions"
              className={`app__menu_link ${currentRoute === '/promotions' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Promotions</span>
            </Link>
        </li>
        <li>
            <Link
              href="/items"
              className={`app__menu_link ${currentRoute === '/items' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Vacant Items</span>
            </Link>
          </li>
        <li>
            <Link
              href="/plantillas"
              className={`app__menu_link ${currentRoute === '/plantillas' ? 'app_menu_link_active' : ''}`}>
              <span className="flex-1 ml-3 whitespace-nowrap">Plantillas</span>
            </Link>
        </li>
      </ul>
    </>
  )
}

export default RecordsSideBar
