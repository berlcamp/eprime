'use client'

import { Sidebar, TopBar } from '@/components'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import ReportsDashboard from '@/components/ReportsDashboard'
import { Cog6ToothIcon } from '@heroicons/react/20/solid'

export default function Page () {
  const searchParams = useSearchParams()
  const page = searchParams.get('page')

  return (
    <>
    <Sidebar>
      <div className="px-2 mt-12">
        {/* Menu */}
        <ul className="pt-8 mt-4 space-y-2 border-gray-700">
          <li>
            <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
              <Cog6ToothIcon className='w-4 h-4'/>
              <span>Reports</span>
            </div>
          </li>
          <li>
              <Link
                href='/reports'
                className={`app__menu_link ${(!page || page === '') ? 'bg-gray-700' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Dashboard</span>
              </Link>
          </li>
        </ul>
      </div>
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      <div>
        {
          (!page || page === '') &&
            <ReportsDashboard/>
        }
      </div>
    </div>
    </>
  )
}
