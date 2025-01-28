'use client'

import { Sidebar, TopBar } from '@/components'
import ReportsDashboard from '@/components/ReportsDashboard'
import ReportsSidebar from '@/components/Sidebars/ReportsSidebar'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const page = searchParams.get('page')

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
