'use client'
import { Sidebar, Title } from '@/components/index'
import TopBar from '@/components/TopBar'
import { useSupabase } from '@/context/SupabaseProvider'
import React, { useEffect, useState } from 'react'

import LandDSidebar from '@/components/Sidebars/LandDSidebar'
import type { UserAccessTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import ChooseUsers from './ChooseUsers'

const Page: React.FC = () => {
  const [users, setUsers] = useState<UserAccessTypes[] | []>([])
  const [loadedSettings, setLoadedSettings] = useState(false)
  const { supabase } = useSupabase()

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('hrm_system_access')
        .select('*, hrm_user:user_id(id,firstname,lastname,middlename)')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error) {
        void logError('system access', 'system_access', '', error.message)
        throw new Error(error.message)
      }

      setUsers(data)

      setLoadedSettings(true)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Sidebar>
        <LandDSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="L&D System Permissions" />
          </div>

          <div className="app__content pb-20">
            {loadedSettings && (
              <>
                <ChooseUsers
                  multiple={true}
                  type="land_committee"
                  users={users}
                  title="L&D Committee"
                />
                <ChooseUsers
                  multiple={true}
                  type="land_supervisors"
                  users={users}
                  title="L&D Committee"
                />
                <ChooseUsers
                  multiple={true}
                  type="land_program_owners"
                  users={users}
                  title="L&D Committee"
                />
                <ChooseUsers
                  multiple={true}
                  type="land_pdc"
                  users={users}
                  title="PDC"
                />
                <ChooseUsers
                  multiple={true}
                  type="land_spc"
                  users={users}
                  title="School Program Coodinators"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
