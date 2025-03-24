'use client'
import Header from '@/components/Headers/Header'
import TopBar from '@/components/Headers/TopBar'
import PmsSideBar from '@/components/Sidebars/PmsSideBar'
import Sidebar from '@/components/Sidebars/Sidebar'
import { useSupabase } from '@/components/supabase-provider'
import Unauthorized from '@/components/Unauthorized'
import { useFilter } from '@/context/FilterContext'
import React, { useEffect, useState } from 'react'

export default function page() {
  const { setToast, hasAccess } = useFilter()

  if (!hasAccess('pms_manager')) return <Unauthorized />

  const { supabase } = useSupabase()

  const [announcement, setAnnouncement] = useState('')

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select()
      .eq('type', 'pms')
      .limit(1)

    if (error) console.error(error)

    data.length > 0 && setAnnouncement(data[0].announcement)
  }

  const handleSave = async () => {
    const { data } = await supabase
      .from('announcements')
      .select()
      .eq('type', 'pms')
      .limit(1)

    if (data.length > 0) {
      await supabase
        .from('announcements')
        .update({ announcement, type: 'pms' })
        .eq('id', data[0].id)
    } else {
      await supabase.from('announcements').insert({ announcement, type: 'pms' })
    }

    // success message
    setToast('success', 'Successfully saved')
  }

  useEffect(() => {
    fetchData()
  }, [])

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
            <Header title="Annoucements" />
          </div>
          <div className="">
            <div className="modal-body relative p-4">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="w-full">
                  <div className="py-2 text-gray-600 italic text-sm">
                    This announcement will be displayed on PMS Home page.
                  </div>
                  <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    className="w-full sm:w-1/2 h-32 text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="flex space-x-2 items-center">
                <button
                  onClick={handleSave}
                  type="button"
                  className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
