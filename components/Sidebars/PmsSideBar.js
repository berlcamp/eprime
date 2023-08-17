'use client'
import { useFilter } from '@/context/FilterContext'
import { ChartBarSquareIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import React from 'react'

const PmsSideBar = () => {
  const { hasAccess, isSchoolHead } = useFilter()
  const hasAccessPmsSettings = hasAccess('pms')

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <ChartBarSquareIcon className='w-4 h-4'/>
            <span>My PMS</span>
          </div>
        </li>
        <li>
            <Link href="/pms" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
              <span className="flex-1 ml-3 whitespace-nowrap">HOME</span>
            </Link>
        </li>
        <li>
            <Link href="/pms/ipcrf" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
              <span className="flex-1 ml-3 whitespace-nowrap">IPCRF</span>
            </Link>
        </li>
        {
          isSchoolHead &&
          <Link href="/pms/opcrf" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
          <span className="flex-1 ml-3 whitespace-nowrap">OPCRF <sup className="text-xs font-bold text-red-500">(Heads)</sup></span>
        </Link>
        }
        {
          (hasAccess('sds') || hasAccess('cid') || hasAccess('sgod')) &&
            <li>
                <Link href="/pms/chiefsopcrf" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                  <span className="flex-1 ml-3 whitespace-nowrap">OPCRF <sup className="text-xs font-bold text-red-500">(Chiefs)</sup></span>
                </Link>
            </li>
        }
      </ul>
      {
        hasAccessPmsSettings &&
          <>
            <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
              <li>
                <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
                  <Cog6ToothIcon className='w-4 h-4'/>
                  <span>SETTINGS</span>
                </div>
              </li>
              <li>
                  <Link href="#" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">Reports</span>
                  </Link>
              </li>
              <li>
                  <Link href="/pms/kra" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">KRA</span>
                  </Link>
              </li>
              <li>
                  <Link href="/pms/objectives" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">Objectives</span>
                  </Link>
              </li>
              <li>
                  <Link href="/pms/competencies" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">Competencies</span>
                  </Link>
              </li>
              <li>
                  <Link href="/pms/ipcrftemplates" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">IPCRF Templates</span>
                  </Link>
              </li>
              <li>
                  <Link href="/pms/opcrftemplates" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">OPCRF Templates</span>
                  </Link>
              </li>
            </ul>
            <ul className="pt-8 mt-4 space-y-2 border-t border-gray-700">
              <li>
                <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
                  <Cog6ToothIcon className='w-4 h-4'/>
                  <span>HOMEPAGE SETTINGS</span>
                </div>
              </li>
              <li>
                  <Link href="/pms/announcements" className="flex items-center p-2 text-sm font-light rounded-lg text-gray-300  hover:bg-gray-700">
                    <span className="flex-1 ml-3 whitespace-nowrap">Annoucements</span>
                  </Link>
              </li>
            </ul>
          </>
      }
    </>
  )
}

export default PmsSideBar
