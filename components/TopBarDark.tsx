import TopMenu from '@/components/TopBars/TopMenu'
import Notifications from '@/components/TopBars/Notifications'
import UserDropdown from '@/components/TopBars/UserDropdown'
import LoginDropDown from '@/components/TopBars/LoginDropDown'

export default function TopBarDark ({ isGuest, isActive = true }: { isGuest?: boolean, isActive?: boolean }) {
  return (
    <div className='fixed top-0 z-20 w-full'>
      <div className='p-2 flex items-center bg-gray-800'>
        <div className='flex-1'>
          <div className='font-semibold text-lg text-white'>PRIME-HRM</div>
        </div>
        <div className='flex space-x-2'>
          {
            !isGuest
              ? <>
                <TopMenu darkMode={true}/>
                <Notifications darkMode={true}/>
                <UserDropdown darkMode={true}/>
                </>
              : <LoginDropDown darkMode={true}/>
          }
        </div>
      </div>
      {
        !isActive &&
          <div className='text-center bg-yellow-100 px-6 py-1 text-sm'>
            Your account status is currently <span className='font-semibold'>PENDING FOR APPROVAL</span>. Please wait for the administrator to verify and approve your account. You will received an email notification once your account is activated.
          </div>
      }
    </div>
  )
}
