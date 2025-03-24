import Header from '@/components/Headers/Header'
import TopBar from '@/components/Headers/TopBar'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Sidebar from '@/components/Sidebars/Sidebar'
import React from 'react'

export default function loading () {
  return (
    <>
      <Sidebar>
        <PmsSideBar/>
      </Sidebar>
      <div className="lg:ml-64 pb-20 dark:bg-gray-900">
        <div>
            {/* Header */}
            <TopBar/>
            <div className='flex items-center space-x-2 mx-4 py-2 border-b border-gray-200 dark:border-gray-500'>
              <Header title='OPCRFs'/>
            </div>

            <TwoColTableLoading/>
        </div>
      </div>
    </>
  )
}
