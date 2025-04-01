import { Sidebar, TopBar } from '@/components'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Header from '@/components/TopBars/Header'

export default function loading() {
  return (
    <>
      <Sidebar>
        <PmsSideBar />
      </Sidebar>
      <div className="lg:ml-64 pb-20 dark:bg-gray-900">
        <div>
          {/* Header */}
          <TopBar />
          <div className="flex items-center space-x-2 mx-4 py-2 border-b border-gray-200 dark:border-gray-500">
            <Header title="IPCRFs" />
          </div>

          <TwoColTableLoading />
        </div>
      </div>
    </>
  )
}
