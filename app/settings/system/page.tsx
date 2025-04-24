'use client'
import { SettingsSideBar, Sidebar, Title } from '@/components/index'
import TopBar from '@/components/TopBar'
import { useSupabase } from '@/context/SupabaseProvider'
import React, { useEffect, useState } from 'react'

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
        <SettingsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="System Permissions" />
          </div>

          <div className="app__content pb-20">
            {loadedSettings && (
              <>
                <ChooseUsers
                  multiple={true}
                  type="settings"
                  users={users}
                  title="Who can manage System Settings"
                />
                <ChooseUsers
                  multiple={true}
                  type="employee_accounts"
                  users={users}
                  title="Who can manage Employee Accounts"
                />
                <ChooseUsers
                  multiple={true}
                  type="records"
                  users={users}
                  title="HR Personnel who can manage Records (Service Records, Assignments, Designations, CTOs, Service Credits, Promotions, Plantillas)"
                />
                <ChooseUsers
                  multiple={true}
                  type="verify_promotions"
                  users={users}
                  title="HR Personnel who can check and verify promotions"
                />
                <ChooseUsers
                  multiple={true}
                  type="certify_leave_credits"
                  users={users}
                  title="HR Personnel who can Certify Leave Credits"
                />
                <ChooseUsers
                  multiple={true}
                  type="cto_sc_approver"
                  users={users}
                  title="Who can approve CTOs and Service Credits"
                />
                <ChooseUsers
                  multiple={true}
                  type="rsp_manager"
                  users={users}
                  title="Who can manage RSP"
                />
                <ChooseUsers
                  multiple={true}
                  type="rsp_reports"
                  users={users}
                  title="Who can view RSP reports"
                />
                <ChooseUsers
                  multiple={true}
                  type="pms_manager"
                  users={users}
                  title="Who can manage PMS"
                />

                <ChooseUsers
                  multiple={true}
                  type="land_hrd"
                  users={users}
                  title="L & D HRD"
                />
                <ChooseUsers
                  multiple={true}
                  type="randr_manager"
                  users={users}
                  title="Who can manage R&R"
                />
                <ChooseUsers
                  multiple={true}
                  type="tracker_manager"
                  users={users}
                  title="Request Tracker Manager - Person who can forward request to other."
                />
                <ChooseUsers
                  multiple={false}
                  type="hr"
                  users={users}
                  title="HR Head / Office-in-charge"
                />
                <ChooseUsers
                  multiple={false}
                  type="sds"
                  users={users}
                  title="Current SDS"
                />
                <ChooseUsers
                  multiple={false}
                  type="asds"
                  users={users}
                  title="Current ASDS"
                />
                {/* L&D */}
                <ChooseUsers
                  multiple={true}
                  type="ld_training_approver"
                  users={users}
                  title="Who can approve Trainings"
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
