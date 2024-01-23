import 'server-only'
import './globals.css'
import SupabaseListener from '@/utils/supabase-listener'
import SupabaseProvider from '@/context/SupabaseProvider'
import { createServerClient } from '@/utils/supabase-server'
import { FilterProvider } from '@/context/FilterContext'
import { Providers } from '@/GlobalRedux/provider'
import { Toaster } from 'react-hot-toast'
import { LandingPage } from '@/components'

import type { Metadata } from 'next'
import type { Employee, UserAccessTypes } from '@/types'
import { logError } from '@/utils/fetchApi'

export const metadata: Metadata = {
  title: 'PRIME-HRM',
  description: 'PRIME-HRM by BTC'
}

// do not cache this layout
export const revalidate = 0

export default async function RootLayout ({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  let sysUsers: Employee[] | null = []
  let sysAccess: UserAccessTypes[] | null = []

  if (session) {
    try {
      const { data: systemAccess, error } = await supabase
        .from('hrm_system_access')
        .select('*, hrm_user:user_id(id,firstname,lastname,middlename)')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error) {
        void logError('root layout system access', 'hrm_system_access', '', error.message)
        throw new Error(error.message)
      }

      sysAccess = systemAccess

      const { data: systemUsers, error: systemUsersError } = await supabase
        .from('hrm_users')
        .select()
        .eq('status', 'Active')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (systemUsersError) {
        void logError('root layout hrm users', 'hrm_users', '', systemUsersError.message)
        throw new Error(systemUsersError.message)
      }

      sysUsers = systemUsers
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <html lang="en">
      <body className={`relative ${session ? 'bg-white' : 'bg-gray-100'}`}>

        <SupabaseProvider systemAccess={sysAccess} session={session} systemUsers={sysUsers}>
            <SupabaseListener serverAccessToken={session?.access_token} />
              {!session && <LandingPage/> }
              {
                session &&
                  <Providers>
                    <FilterProvider>
                      <Toaster/>
                      {children}
                    </FilterProvider>
                  </Providers>
              }
          </SupabaseProvider>
      </body>
    </html>
  )
}
