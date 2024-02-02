/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import { OneColLayoutLoading, Sidebar, Title, TopBar } from '@/components'
import LeaveCard from '@/components/LeaveCard/LeaveCard'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import Pds from '@/components/Pds/Pds'
import UserRequests from '@/components/Tracker/UserRequests'
import Cto from '@/components/Cto/Cto'
import { useSupabase } from '@/context/SupabaseProvider'
import type { DesignationTypes, Employee } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Avatar from 'react-avatar'
import ServiceRecords from '@/components/ServiceRecords/page'
import ServiceCredits from '@/components/ServiceCredits/ServiceCredits'
import Promotions from '@/components/Promotions/Promotions'
import { format } from 'date-fns'
import Pdf from '@/components/Pdf/Pdf'

export default function Page ({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<Employee | null>(null)

  const userId = params.id
  const searchParams = useSearchParams()
  const page = searchParams.get('page')

  // counters
  const [myctoCount, setMyctoCount] = useState('')

  const { supabase } = useSupabase()

  const counter = async () => {
    const today = new Date()

    // add 1 month
    const filterDate = format(new Date(today.setMonth(today.getMonth() + 1)), 'yyyy-MM-dd')

    const { count: ctoCounter } = await supabase
      .from('hrm_cto_users')
      .select('id', { count: 'exact' })
      .eq('hrm_user_id', userId)
      .is('status', null)
      .lte('expiration', filterDate)

    if (ctoCounter > 0) setMyctoCount(`Expiring soon (${ctoCounter})`)
  }

  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('hrm_users')
          .select('*, hrm_schools:school_id(name), hrm_positions:position_id(name), hrm_offices:office_id(name), hrm_designations(type,status,designation,area_assigned,hrm_schools:school_id(name),hrm_offices:office_id(name))')
          .eq('id', userId)
          .limit(1)
          .maybeSingle()

        if (error) throw new Error(error.message)

        setUserData(data)
        setLoading(false)
      } catch (e) {
        console.error('fetch error: ', e)
      }
    }

    void fetchAccountDetails()

    void counter()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
    <Sidebar>
      { loading && <OneColLayoutLoading rows={3}/> }
      {
        (!loading && userData) &&
          <>
            <div className="px-2 mt-12">
              <div>
                  {
                    (userData.avatar_url && userData.avatar_url !== '')
                      ? <div className='flex items-center justify-center'><Image src={userData.avatar_url} width={100} height={150} alt="alt" className='rounded-full'/></div>
                      : <div className='flex items-center justify-center'><Avatar round={false} size="100" name={userData.firstname} className='rounded-full'/></div>
                  }
              </div>
              <div className='text-center mt-2 capitalize text-sm text-gray-200 font-bold'>{userData.firstname} {userData.middlename} {userData.lastname}</div>
              <div className='text-center mt-1 text-xs text-gray-400'>{userData.email}</div>
              <div className='text-center mt-1 capitalize text-xs text-gray-400'>{userData.hrm_positions?.name}</div>
              {
                userData.hrm_designations?.length > 0
                  ? <>
                    {
                      userData.hrm_designations.map((designation: DesignationTypes, index) => (
                        designation.status === 'Active' &&
                          <div key={index}>
                            <div className='text-center mt-2 capitalize text-xs text-gray-300'>Current Designation:</div>
                            {
                              designation.type === 'Function only'
                                ? <div>{designation.designation}</div>
                                : (
                                    designation.area_assigned === 'office'
                                      ? <div>{designation.designation} - {designation.hrm_offices?.name}</div>
                                      : <div>{designation.designation} - {designation.hrm_schools?.name}</div>
                                  )
                            }
                          </div>
                      ))
                    }
                    </>
                  : <div className='text-center mt-2 capitalize text-xs text-gray-300'>{userData.hrm_schools?.name} {userData.hrm_offices?.name}</div>
              }
              {/* Menu */}
              <ul className="pt-8 mt-4 space-y-2 border-gray-700">
                <li>
                    <Link
                      href={`/profile/${userId}?page=pds`}
                      className={`app__profile_menu_link ${(page === 'pds') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Personal Data Sheet</span>
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=leavecard`}
                      className={`app__profile_menu_link ${(page === 'leavecard') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Leave Card</span>
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=requests`}
                      className={`app__profile_menu_link ${(page === 'requests') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Requests (Leave, Travel, etc)</span>
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=ctos`}
                      className={`app__profile_menu_link ${(page === 'ctos') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">CTOs</span>
                      {
                        myctoCount !== '' &&
                          <span className='inline-flex items-center justify-center rounded-lg bg-red-500'>
                            <span className='px-1 text-white text-xs'>{myctoCount}</span>
                          </span>
                      }
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=servicecredits`}
                      className={`app__profile_menu_link ${(page === 'servicecredits') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Service Credits</span>
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=servicerecords`}
                      className={`app__profile_menu_link ${(page === 'servicerecords') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Service Records</span>
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=promotions`}
                      className={`app__profile_menu_link ${(page === 'promotions') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Promotions</span>
                    </Link>
                </li>
                <li>
                    <Link
                      href={`/profile/${userId}?page=pdf`}
                      className={`app__profile_menu_link ${(page === 'pdf') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Position Description Form</span>
                    </Link>
                </li>
              </ul>
            </div>
          </>
      }
    </Sidebar>
    <TopBar/>
    <div className="app__main">
      { loading && <TwoColTableLoading/> }
      <div>
        {
          (page && page === 'pds') &&
            <>
              <div className='app__title'>
                <Title title='Personal Data Sheet'/>
              </div>
              <div className='mt-4 mx-2'>
                <Pds userId={userId}/>
              </div>
            </>
        }
        {
          (page && page === 'leavecard') &&
            <>
              <div className='app__title'>
                <Title title='Leave Card'/>
              </div>
              <div className='mt-4 mx-2'>
                <LeaveCard userId={userId}/>
              </div>
            </>
        }
        {
          (page && page === 'requests') &&
            <UserRequests userId={userId}/>
        }
        {
          (page && page === 'ctos') &&
            <Cto userId={userId}/>
        }
        {
          (page && page === 'servicecredits') &&
            <ServiceCredits userId={userId}/>
        }
        {
          (page && page === 'servicerecords') &&
            <ServiceRecords userId={userId}/>
        }
        {
          (page && page === 'promotions') &&
            <Promotions userId={userId}/>
        }
        {
          (page && page === 'pdf') &&
            <Pdf userId={userId}/>
        }
      </div>
    </div>
    </>
  )
}
