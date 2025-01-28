'use client'

import { Sidebar, TopBar, Unauthorized } from '@/components'
import ReportsDashboard from '@/components/ReportsDashboard'
import ReportsSidebar from '@/components/Sidebars/ReportsSidebar'
import { superAdmins } from '@/constants'
import { useFilter } from '@/context/FilterContext'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const page = searchParams.get('page')

  const { hasAccess, session } = useFilter()

  // Check access from permission settings or Super Admins
  if (!hasAccess('records') && !superAdmins.includes(session.user.email))
    return <Unauthorized />

  return (
    <>
      <Sidebar>
        <ReportsSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>{(!page || page === '') && <ReportsDashboard />}</div>
      </div>
    </>
  )
}
