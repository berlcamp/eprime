'use client'

import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

function MobileMenu() {
  const [viewSidebar, setViewSidebar] = useState(false)

  const toggleSidebar = () => {
    setViewSidebar(!viewSidebar)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-3 left-3 z-50 rounded-full bg-gray-800 text-white p-2"
        onClick={toggleSidebar}
      >
        <MenuIcon className="w-6 h-6" />
      </button>
      {/* Sidebar Overlay for Mobile */}
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-300 ${
          viewSidebar ? 'opacity-100 visible' : 'opacity-0 invisible'
        } lg:hidden`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed top-15 left-0 z-10 w-64 bg-gray-700 transition-transform duration-300 transform ${
          viewSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:block`}
        aria-label="Sidebar"
      >
        <div className="h-full px-4 py-6 overflow-y-auto">
          <ul className="space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 space-x-1 px-2">
                <span className="font-semibold">Menu</span>
              </div>
            </li>
            <li>
              <Link href="/" className="app__menu_link">
                <span className="flex-1 ml-3 whitespace-nowrap">Home</span>
              </Link>
            </li>
            <li>
              <Link href="/vacant" className="app__menu_link">
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Vacant Items
                </span>
              </Link>
            </li>
            <li>
              <Link href="/rankingapplicantresults" className="app__menu_link">
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Ranking Results
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  )
}

export default MobileMenu
