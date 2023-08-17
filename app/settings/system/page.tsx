'use client'
import TopBar from '@/components/TopBar'
import { Sidebar, SettingsSideBar, Title } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import React, { useEffect, useState } from 'react'
import SelectUserNames from './SelectUserNames'
import { useFilter } from '@/context/FilterContext'

import type { settingsDataTypes } from '@/types'

const Page: React.FC = () => {
  const { supabase } = useSupabase()
  const [settingsData, setSettingsData] = useState<settingsDataTypes[] | []>([])
  const [results, setResults] = useState(false)
  const [settingsId, setSettingsId] = useState(null)
  const { setToast } = useFilter()

  const handleSave = async () => {
    let query = supabase
      .from('system_settings')

    if (settingsId) {
      query = query.upsert({ id: settingsId, type: 'system_access', data: settingsData })
    } else {
      query = query.insert({ type: 'system_access', org_id: process.env.NEXT_PUBLIC_ORG_ID, data: settingsData })
    }
    query = query.select()

    const { error } = await query

    if (error) {
      console.error(error)
    } else {
      // pop up the success message
      setToast('success', 'Successfully saved.')
    }
  }

  const handleManagerChange = (newdata: any, type: string) => {
    const tempSettings = Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type !== type) : []
    const updatedSettings: settingsDataTypes[] = [...tempSettings, { access_type: type, data: newdata }]
    setSettingsData(updatedSettings)
  }

  const fetchData = async () => {
    const { data: res, error } = await supabase
      .from('system_settings')
      .select()
      .eq('type', 'system_access')
      .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)
      .limit(1)
      .single()

    if (error) console.error(error)

    if (res) {
      setResults(true)
      setSettingsData(res.data)
      setSettingsId(res.id)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <>
      <Sidebar>
        <SettingsSideBar/>
      </Sidebar>
      <TopBar/>
      <div className="app__main">
        <div>
            <div className='app__title'>
              <Title title='System Permissions'/>
            </div>

            <div className='app__content'>
              {
                results && (
                  <>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='settings' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'settings') : []} title='Who can manage System Settings'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='employee_accounts' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'employee_accounts') : []} title='Who can manage Employee Accounts'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='records' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'records') : []} title='Who can manage Records (Assignments, Designations, CTOs, Service Credits)'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='rsp' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'rsp') : []} title='Who can manage R/S/P Settings'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='pms' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'pms') : []} title='Who can manage PMS Settings'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={true} type='lad' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'lad') : []} title='Who can manage L & D Settings'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={false} type='sds' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'sds') : []} title='Current SDS'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={false} type='asds' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'asds') : []} title='Current ASDS'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={false} type='cid' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'cid') : []} title='Current CID Chief'/>
                  <SelectUserNames handleManagerChange={handleManagerChange} multiple={false} type='sgod' settingsData={Array.isArray(settingsData) ? settingsData.filter((item: settingsDataTypes) => item.access_type === 'sgod') : []} title='Current SGOD Chief'/>
                  </>
                )
              }
              <button
                onClick={handleSave}
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm">
                Save Settings
              </button>
            </div>

        </div>
      </div>
    </>
  )
}
export default Page
