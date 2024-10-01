import { Announcements, Jobs, TopBarDark } from '@/components'
import TrackerBox from '@/components/TrackerBox'
import { createServerClient } from '@/utils/supabase-server'

export default async function Page() {
  const supabase = createServerClient()
  const {
    data: { session }
  } = await supabase.auth.getSession()
  return (
    <>
      <div className="app__home">
        <TopBarDark isGuest={session ? false : true} />
        <div className="bg-gray-700 pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center">
          <div className="bg-gray-100 p-4 rounded-lg border md:w-[420px] md:max-w-[420px]">
            <Jobs />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg border mt-10 md:mt-0 md:max-w-[420px] lg:w-[620px] lg:max-w-[620px]">
            <Announcements />
          </div>
        </div>
        <div className="border-b">
          <TrackerBox />
        </div>
        {/* <div className=''>
          <OrganizationalStructure/>
        </div> */}
        <div className="mt-auto bg-gray-800 p-4 text-white fixed bottom-0 w-full">
          <div className="text-white text-center text-xs">
            &copy; PRIME-HRM v2.0
          </div>
        </div>
      </div>
    </>
  )
}
