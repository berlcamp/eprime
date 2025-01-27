'use client'
import { CustomButton, SettingsSideBar, Sidebar, Title } from '@/components'
import TopBar from '@/components/TopBar'
import { useSupabase } from '@/context/SupabaseProvider'
import React from 'react'

import { logError } from '@/utils/fetchApi'

const Page: React.FC = () => {
  const { supabase } = useSupabase()

  const handleRunNosiNosa = async () => {
    try {
      const { error } = await supabase
        .from('hrm_system_access')
        .select('*, hrm_user:user_id(id,firstname,lastname,middlename)')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (error) {
        void logError('system access', 'system_access', '', error.message)
        throw new Error(error.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <Sidebar>
        <SettingsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Cron Jobs" />
          </div>

          <div className="app__content pb-20">
            <CustomButton
              containerStyles="app__btn_green"
              title="Run NOSI/NOSA Cron"
              btnType="button"
              handleClick={handleRunNosiNosa}
            />
          </div>
        </div>
      </div>
    </>
  )
}
export default Page
