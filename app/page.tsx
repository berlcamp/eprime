import { createServerClient } from '@/utils/supabase-server'
import { OrganizationalStructure, TopBarDark } from '@/components'

export default async function Page () {
  const supabase = createServerClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const isActive = session?.user.user_metadata.status !== 'active' // returns true or false

  return (
    <>
      <div className="app__home">
        <TopBarDark isGuest={false}/>
        <div className='mt-20'>
          {
            !isActive
              ? <div className='flex justify-center text-lg'>
                  Your account is now queued for approval from the administrator. Please come back later.
                </div>
              : <OrganizationalStructure/>
          }
        </div>
      </div>
    </>
  )
}
