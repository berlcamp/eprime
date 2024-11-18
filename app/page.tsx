import { Announcements, TopBarDark } from '@/components'
import Footer from '@/components/Footer'
import TrackerApplicationBox from '@/components/TrackerApplicationBox'
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
          <div className="md:w-[620px] md:max-w-[620px] space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg border ">
              <TrackerBox />
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border">
              <TrackerApplicationBox />
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg border mt-10 md:mt-0 md:w-[620px] md:max-w-[620px]">
            <Announcements />
          </div>
        </div>
        {/* <div className=''>
          <OrganizationalStructure/>
        </div> */}
        <Footer />
      </div>
    </>
  )
}
