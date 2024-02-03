/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'
import { Sidebar } from '@/components'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { useRouter } from 'next/navigation'

export default function Page () {
  const router = useRouter()
  const { session } = useSupabase()

  router.push(`/profile/${session.user.id}`)

  return (
    <>
    <Sidebar>
      <></>
    </Sidebar>
    <div>
      <TwoColTableLoading/>
    </div>
    </>
  )
}
