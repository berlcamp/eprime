'use client'

import { FilterProvider } from '@/context/FilterContext'
import SupabaseProvider from '@/context/SupabaseProvider'
import { Providers } from '@/GlobalRedux/provider'
import SupabaseListener from '@/utils/supabase-listener'
import { Session } from '@supabase/supabase-js'
import { ReactNode, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import TopLoadingBar from '@/components/TopLoadingBar'

// Match the shape expected by SupabaseProvider
interface ClientProvidersProps {
  session: Session | null
  systemAccess: any // Replace with actual types if available
  systemUsers: any
  systemSchools: any
  systemOffices: any
  children: ReactNode
}

export default function ClientProviders({
  session,
  children,
  systemAccess,
  systemUsers,
  systemSchools,
  systemOffices
}: ClientProvidersProps) {
  return (
    <SupabaseProvider
      session={session}
      systemAccess={systemAccess}
      systemUsers={systemUsers}
      systemSchools={systemSchools}
      systemOffices={systemOffices}
    >
      <SupabaseListener serverAccessToken={session?.access_token} />
      <Suspense>
        <TopLoadingBar />
      </Suspense>
      {session ? (
        <Providers>
          <FilterProvider>
            <Toaster />
            {children}
          </FilterProvider>
        </Providers>
      ) : (
        children
      )}
    </SupabaseProvider>
  )
}
