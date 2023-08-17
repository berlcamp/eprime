import { Announcements, Jobs, OrganizationalStructure, TopBarDark } from '@/components'

export default async function LandingPage () {
  return (
    <>
      <div className="app__landingpage">
        <TopBarDark isGuest={true}/>
        <div className='bg-gray-700 pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center'>
          <div className='bg-gray-100 p-4 rounded-lg border md:w-[420px] md:max-w-[420px]'>
            <Jobs/>
          </div>
          <div className='bg-gray-100 p-4 rounded-lg border mt-10 md:mt-0 md:max-w-[420px] lg:w-[620px] lg:max-w-[620px]'>
            <Announcements/>
          </div>
        </div>
        <div className=''>
          <OrganizationalStructure/>
        </div>
        <div className='bg-gray-800 p-4'>
          <div className='text-white text-center text-xs'>&copy; PRIME-HRM 2023</div>
        </div>
      </div>
    </>
  )
}
