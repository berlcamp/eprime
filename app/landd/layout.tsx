import { createServerClient } from '@/utils/supabase-server'
import { redirect } from 'next/navigation'

// do not cache this layout
export const revalidate = 0

export default async function Layout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }
  return <>{children}</>
}
