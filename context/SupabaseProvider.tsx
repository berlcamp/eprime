'use client'

import { Session } from '@supabase/supabase-js'
import { createContext, ReactNode, useContext, useState } from 'react'
import { createBrowserClient } from '../utils/supabase-browser'

// Define the shape of your context
interface SupabaseContextType {
  supabase: ReturnType<typeof createBrowserClient>
  session: Session | null
  systemAccess: any // Replace `any` with correct types if available
  systemUsers: any
  systemSchools: any
  systemOffices: any
}

// Define props expected by the provider
interface SupabaseProviderProps extends Omit<SupabaseContextType, 'supabase'> {
  children: ReactNode
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
)

export default function SupabaseProvider({
  children,
  session,
  systemAccess,
  systemUsers,
  systemSchools,
  systemOffices
}: SupabaseProviderProps) {
  const [supabase] = useState(() => createBrowserClient())

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        session,
        systemAccess,
        systemUsers,
        systemSchools,
        systemOffices
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

// Custom hook to use the Supabase context
export function useSupabase(): SupabaseContextType {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
