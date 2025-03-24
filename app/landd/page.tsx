'use client'
import { Sidebar, TopBar } from '@/components'
import LandDSidebar from '@/components/Sidebars/LandDSidebar'
import { BookmarkIcon } from '@heroicons/react/24/solid'

export default function page() {
  return (
    <>
      <Sidebar>
        <LandDSidebar />
      </Sidebar>
      <div className="lg:ml-64 pb-20 dark:bg-gray-900">
        <TopBar />
        <div>
          <div className="p-4 pt-20 text-gray-800 dark:text-gray-300 dark:bg-gray-900 h-screen">
            <div className="flex items-center justify-center space-x-2">
              <BookmarkIcon className="h-5 w-5 " />
              <h1 className="text-3xl">Learning and Development</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
