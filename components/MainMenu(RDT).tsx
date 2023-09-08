'use client'
import { ChartBarSquareIcon, CreditCardIcon, DocumentDuplicateIcon, HomeIcon, PencilSquareIcon, TableCellsIcon, UsersIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'

const MainMenu: React.FC = () => {
  return (
    <div className="py-1 relative">
      <div className='px-6 mt-2 text-gray-700 text-xl font-semibold'>Menu</div>
      <div className='px-4 py-2 overflow-y-auto h-[calc(100vh-170px)]'>
        <div className='lg:flex lg:space-x-2 lg:space-y-0 space-y-2 justify-center lg:flex-row-reverse'>
          <div className='px-2 py-4 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col lg:mx-2 space-y-1'>
            <div className='text-gray-700 text-lg font-semibold'>Shortcuts</div>
            <Link href='/' className='app__menu_item'>
              <PencilSquareIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>Create Purchase Request</div>
            </Link>
            <Link href='/' className='app__menu_item'>
              <CreditCardIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>Create New Payroll</div>
            </Link>
            <Link href='/' className='app__menu_item'>
              <TableCellsIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>Create New Canvass</div>
            </Link>
            <Link href='/' className='app__menu_item'>
              <ChartBarSquareIcon className='w-6 h-6'/>
              <div className='app__menu_item_label'>Reports</div>
            </Link>
          </div>
          <div className='px-2 py-4 lg:w-96 border text-gray-600 rounded-lg bg-white shadow-md flex flex-col space-y-2'>
            <div className='text-gray-700 text-lg font-semibold'>RDM</div>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <HomeIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Dashboard</div>
                  <div className='app__menu_item_label_description'>Go to dashboard page.</div>
                </div>
              </div>
            </Link>
            <Link href='/employees'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Human Resource Information System</div>
                  <div className='app__menu_item_label_description'>Employee details, records, and account settings.</div>
                </div>
              </div>
            </Link>
            <Link href='/'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <DocumentDuplicateIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Payroll System</div>
                  <div className='app__menu_item_label_description'>Attendance, DTR, Payslips.</div>
                </div>
              </div>
            </Link>
            <Link href='/assignments'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Supply and Material Management</div>
                  <div className='app__menu_item_label_description'>Canvass, Inventory Management</div>
                </div>
              </div>
            </Link>
            <Link href='/assignments'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Purchase Orders</div>
                  <div className='app__menu_item_label_description'>Purchase Orders Mgmt.</div>
                </div>
              </div>
            </Link>
            <Link href='/assignments'>
              <div className='app__menu_item'>
                <div className='pt-1'>
                  <UsersIcon className='w-8 h-8'/>
                </div>
                <div>
                  <div className='app__menu_item_label'>Projects</div>
                  <div className='app__menu_item_label_description'>Projects and Location Management.</div>
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
                  <div className='app__menu_item_label_description'>System Access and Permissions. </div>
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
