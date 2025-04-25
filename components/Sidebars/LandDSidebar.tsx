/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LandDSidebar = () => {
  const currentRoute = usePathname()

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <span>LEARNING & DEVELOPMENT</span>
          </div>
        </li>
        <li>
          <Link
            href="/landd/reports"
            className={`app__menu_link ${
              currentRoute === '/landd/reports' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Personnel Summary
            </span>
          </Link>
        </li>
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <span>ASSESSMENT</span>
          </div>
        </li>
        <li>
          <Link
            href="/landd/idp"
            className={`app__menu_link ${
              currentRoute === '/landd/idp' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Individual Development Plans
            </span>
          </Link>
        </li>

        <li>
          <Link
            href="/landd/trainingneedsassessment"
            className={`app__menu_link ${
              currentRoute === '/landd/trainingneedsassessment'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Training Needs Assessment
            </span>
          </Link>
        </li>
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <span>PLANNING</span>
          </div>
        </li>
        <li>
          <Link
            href="/landd/learningactionplan"
            className={`app__menu_link ${
              currentRoute === '/landd/learningactionplan'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Learning Action Plan
            </span>
          </Link>
        </li>
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <span>DESIGNING</span>
          </div>
        </li>
        <li>
          <Link
            href="/landd/programproposal"
            className={`app__menu_link ${
              currentRoute === '/landd/programproposal'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Program / Activity Proposals
            </span>
          </Link>
        </li>
        <li>
          <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
            <span>DELIVERY</span>
          </div>
        </li>
        <li>
          <Link
            href="/landd/implementedprogram"
            className={`app__menu_link ${
              currentRoute === '/landd/implementedprogram'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Implemented / Delivered L&D Programs
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/landd/pooloffacilitators"
            className={`app__menu_link ${
              currentRoute === '/landd/pooloffacilitators'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Pool of Learning Facilitators
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/landd/externalserviceprovider"
            className={`app__menu_link ${
              currentRoute === '/landd/externalserviceprovider'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              External Service Providers
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/landd/programmanagementteam"
            className={`app__menu_link ${
              currentRoute === '/landd/programmanagementteam'
                ? 'app_menu_link_active'
                : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Program Management Team
            </span>
          </Link>
        </li>
      </ul>
    </>
  )
}

export default LandDSidebar
