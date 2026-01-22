import { createServerClient } from '@/utils/supabase-server'
import 'server-only'
import './globals.css'

import ClientProviders from '@/components/ClientProviders'
import Maintenance from '@/components/Maintenance'
import Suspension from '@/components/Suspension'
import type { Employee, Office, SchoolTypes, UserAccessTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PRIME-HRM',
  description: 'PRIME-HRM by BTC'
}

// do not cache this layout
export const revalidate = 0

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  let sysUsers: Employee[] | null = []
  let sysAccess: UserAccessTypes[] | null = []
  let sysSchools: SchoolTypes[] | null = []
  let sysOffices: Office[] | null = []

  if (session) {
    try {
      const { data: systemAccess, error } = await supabase
        .from('hrm_system_access')
        .select('*, hrm_user:user_id(id,firstname,lastname,middlename)')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error) {
        void logError(
          'root layout system access',
          'hrm_system_access',
          '',
          error.message
        )
        throw new Error(error.message)
      }

      const { data: systemUsers, error: error2 } = await supabase
        .from('hrm_users')
        .select()
      // .eq('status', 'Active')

      if (error2) {
        void logError('root layout hrm users', 'hrm_users', '', error2.message)
        throw new Error(error2.message)
      }

      const { data: schools, error: error3 } = await supabase
        .from('hrm_schools')
        .select()
        .not('head_user_id', 'is', null)
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error3) {
        void logError(
          'root layout hrm schools',
          'hrm_schools',
          '',
          error3.message
        )
        throw new Error(error3.message)
      }

      const { data: offices, error: error4 } = await supabase
        .from('hrm_offices')
        .select()
        .not('head_user_id', 'is', null)
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error4) {
        void logError(
          'root layout hrm offices',
          'hrm_schools',
          '',
          error4.message
        )
        throw new Error(error4.message)
      }

      sysAccess = systemAccess
      sysUsers = systemUsers
      sysSchools = schools
      sysOffices = offices
    } catch (err) {
      return 'Something went wrong, please contact the system administrator.'
    }
  }

  const isMaintenance = false
  const isSuspended = false

  if (isMaintenance) {
    return (
      <html lang="en">
        <body className="dark:bg-[#191919]" suppressHydrationWarning>
          <Maintenance />
        </body>
      </html>
    )
  }

  if (isSuspended) {
    return (
      <html lang="en">
        <body className="bg-gray-200" suppressHydrationWarning>
          <Suspension />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={`relative ${session ? 'bg-white' : 'bg-gray-200'}`}>
        <ClientProviders
          session={session}
          systemAccess={sysAccess}
          systemUsers={sysUsers}
          systemSchools={sysSchools}
          systemOffices={sysOffices}
        >
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
