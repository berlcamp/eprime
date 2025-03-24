import 'server-only'
import React from 'react'
import { createServerClient } from '@/utils/supabase-server'
import Main from './Main'

export const metadata = { title: 'OPCRF' }

// do not cache this page
export const revalidate = 0

export default async function page () {
  const supabase = createServerClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Fetch OPCRF Templates
  const { count, data } = await supabase
    .from('chiefs_opcrf')
    .select()
    .eq('user_id', session.user.id)
    .limit(10)
    .order('id', { ascending: false })

  return (
    <>
      <Main
        preFetchedData={data}
        count={count}/>
    </>
  )
}
