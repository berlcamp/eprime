'use client'

import { UserIcon } from '@heroicons/react/20/solid'
import Title from './Title'

export default function ReportsDashboard () {
  return (
    <>
      <div>
        <div className='app__title'>
          <Title title='Reports'/>
        </div>

        {/* Main Content */}
        <div className='w-full px-2 pt-4 bg-gray-100'>
          <div className="container mx-auto p-2 lg:grid lg:grid-cols-2 lg:gap-2">
            <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
              <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                <div className='flex space-x-2 items-center'>
                  <UserIcon className='w-4 h-4'/>
                  <span>Accounts</span>
                </div>
              </div>
              <div className='items-center'>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Unapproved Registrations</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Incomplete Setup</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
                <div className='inline-flex flex-col text-center px-2'>
                  <div className='text-xs text-gray-500'>Active Employees</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 mb-4 rounded-md shadow-md text-gray-600">
              <div className="text-sm font-semibold px-2 mb-2 text-gray-600">
                <div className='flex space-x-2 items-center'>
                  <UserIcon className='w-4 h-4'/>
                  <span>Personnel</span>
                </div>
              </div>
              <div className='space-x-1 items-center'>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Teaching</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Non-teaching</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
                <div className='inline-flex flex-col text-center border-r px-2'>
                  <div className='text-xs text-gray-500'>Male</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
                <div className='inline-flex flex-col text-center'>
                  <div className='text-xs text-gray-500'>Female</div>
                  <div className='text-xs text-gray-700 font-bold'>22</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </>
  )
}
