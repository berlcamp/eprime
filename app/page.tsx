import { Announcements, TopBarDark } from '@/components'
import Cover from '@/components/Cover'
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
        <Cover />
        <div className="bg-gray-700 pb-10 -mt-32 px-6 md:flex items-start md:space-x-4 justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="z-10">
              <div className="bg-gray-100 p-4 rounded-lg border">
                <TrackerBox />
              </div>
            </div>

            <div className="z-10">
              <div className="bg-gray-100 p-4 rounded-lg border pb-32">
                <TrackerApplicationBox />
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg border z-10">
              <Announcements />
            </div>
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
