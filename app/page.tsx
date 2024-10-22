import { Announcements, Jobs, TopBarDark } from '@/components'
import Footer from '@/components/Footer'
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
        <Footer />
      </div>
    </>
  )
}
