'use client'
import LocalDbBadge from '@/components/LocalDbBadge'
import LoginDropDown from '@/components/TopBars/LoginDropDown'
import Notifications from '@/components/TopBars/Notifications'
import TopMenu from '@/components/TopBars/TopMenu'
import UserDropdown from '@/components/TopBars/UserDropdown'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileMenu from './MobileMenu'

export default function TopBarDark({ isGuest }: { isGuest?: boolean }) {
  const currentRoute = usePathname()
  return (
    <>
      <div className="fixed top-0 z-20 w-full">
        <div className="p-2 flex items-center bg-gray-800">
          <div className="hidden flex-1 lg:flex">
            <Link href="/" className="font-semibold text-lg text-white">
              PRIME-HRM
            </Link>
            <div className="ml-10 space-x-4">
              <Link
                href="/"
                className="text-gray-300 p-1 whitespace-nowrap rounded-sm font-medium text-xs uppercase hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/vacant"
                className={`${
                  currentRoute === '/vacant'
                    ? 'text-white underline underline-offset-4 font-medium'
                    : 'text-gray-300'
                } p-1 whitespace-nowrap rounded-sm text-xs uppercase hover:text-white`}
              >
                Vacant Items
              </Link>
              <Link
                href="/rankingapplicantresults"
                className={`${
                  currentRoute === '/rankingapplicantresults'
                    ? 'text-white underline underline-offset-4 font-medium'
                    : 'text-gray-300'
                } p-1 whitespace-nowrap rounded-sm text-xs uppercase hover:text-white`}
              >
                Ranking Results
              </Link>
            </div>
          </div>
          <div className="flex flex-1 justify-end items-center space-x-2">
            <LocalDbBadge darkMode={true} />
            {!isGuest ? (
              <>
                <TopMenu darkMode={true} />
                <Notifications darkMode={true} />
                <UserDropdown />
              </>
            ) : (
              <LoginDropDown darkMode={true} />
            )}
          </div>
        </div>
        <div className="lg:hidden">
          <MobileMenu />
        </div>
      </div>
    </>
  )
}
