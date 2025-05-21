'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import { AnnouncementTypes } from '@/types'
import { Fragment, useEffect, useState } from 'react'

export default function Announcements() {
  const { supabase } = useSupabase()
  const [list, setList] = useState<AnnouncementTypes[]>([])

  const fetchData = async () => {
    try {
      const { data } = await supabase.from('hrm_announcements').select()

      setList(data ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  // Featch data
  useEffect(() => {
    setList([])
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="">
      <h4 className="text-xl font-semibold mb-6">Announcements</h4>
      <div className="mb-8">
        {list.length > 0 &&
          list.map((item, index) => (
            <Fragment key={index}>
              <div className="font-bold">{item.title}</div>
              <div className="text-sm mb-8">{item.description}</div>
            </Fragment>
          ))}
      </div>
    </div>
  )
}
