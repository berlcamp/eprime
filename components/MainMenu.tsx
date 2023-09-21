'use client'
import { BookOpenIcon, BriefcaseIcon, ChartBarSquareIcon, CreditCardIcon, DocumentDuplicateIcon, HomeIcon, TableCellsIcon, TrophyIcon, UsersIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

const MainMenu = () => {
  return (
    <div className="py-1 relative">
      <div className='px-6 mt-2 text-gray-700 text-xl font-semibold'>Menu</div>
      <div className='px-4 py-2 overflow-y-auto h-[calc(100vh-170px)]'>
        <div className='lg:flex lg:space-x-2 lg:space-y-0 space-y-2 justify-center lg:flex-row-reverse'>
          <div className='px-2 py-4 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col lg:mx-2 space-y-1'>
            <div className='text-gray-700 text-lg font-semibold'>Shortcuts</div>
            <Link href='/' className='app__menu_item'>
              <TableCellsIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>My Leave Requests</div>
            </Link>
            <Link href='/' className='app__menu_item'>
              <CreditCardIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>My Leave Card</div>
            </Link>
            <Link href='/' className='app__menu_item'>
              <TableCellsIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>My Service Records</div>
            </Link>
            <Link href='/' className='app__menu_item'>
              <ChartBarSquareIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>PMS</div>
            </Link>
            <Link href='/myctos' className='app__menu_item'>
              <BriefcaseIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>My CTO&apos;s</div>
            </Link>
            <Link href='/myservicecredits' className='app__menu_item'>
              <BriefcaseIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>My Service Credits</div>
            </Link>
          </div>
          <div className='px-2 py-4 lg:w-96 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col space-y-2'>
            <div className='text-gray-700 text-lg font-semibold'>Human Resource</div>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <HomeIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Home</div>
                  <div className='app__menu_item_label_description'>Go to home page.</div>
                </div>
              </div>
            </Link>
            <Link href='/employees'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Manage Employees</div>
                  <div className='app__menu_item_label_description'>Employee details, records, and account settings.</div>
                </div>
              </div>
            </Link>
            <Link href='/myleaverequests'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <DocumentDuplicateIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Requests</div>
                  <div className='app__menu_item_label_description'>Leave requests, travel authorities, pass slips.</div>
                </div>
              </div>
            </Link>
            <Link href='/assignments'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Records</div>
                  <div className='app__menu_item_label_description'>Assignments, designations, CTO, service credits, promotions, items.</div>
                </div>
              </div>
            </Link>
            <div className='pt-4'>
              <hr/>
            </div>
            <div className='text-gray-700 text-lg font-semibold'>PRIME</div>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>R/S/P</div>
                  <div className='app__menu_item_label_description'>Recruitment, selection, and placement.</div>
                </div>
              </div>
            </Link>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <ChartBarSquareIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Performance Mgmt System</div>
                  <div className='app__menu_item_label_description'>Ipcrf/opcrf, development plans.</div>
                </div>
              </div>
            </Link>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <BookOpenIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Learning & Devt</div>
                  <div className='app__menu_item_label_description'>Development plans and trainings. </div>
                </div>
              </div>
            </Link>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <TrophyIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Rewards & Recognation</div>
                  <div className='app__menu_item_label_description'>Pasidungog, loyalty, tribute to retirees, gawad agad.</div>
                </div>
              </div>
            </Link>
            <div className='pt-4'>
              <hr/>
            </div>
            <div className='text-gray-700 text-lg font-semibold'>System</div>
            <Link href='/settings/system'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>System Settings</div>
                  <div className='app__menu_item_label_description'>System Access, Schools, Districts, Positions. </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MainMenu
