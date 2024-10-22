import LoginDropDown from '@/components/TopBars/LoginDropDown'
import Notifications from '@/components/TopBars/Notifications'
import TopMenu from '@/components/TopBars/TopMenu'
import UserDropdown from '@/components/TopBars/UserDropdown'

export default function TopBarDark({ isGuest }: { isGuest?: boolean }) {
  return (
    <div className="fixed top-0 z-20 w-full">
      <div className="p-2 flex items-center bg-gray-800">
        <div className="flex-1">
          <div className="font-semibold text-lg text-white">PRIME-HRM</div>
        </div>
        <div className="flex space-x-2">
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
    </div>
  )
}
