/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import { BsCamera } from 'react-icons/bs'
import { Sidebar, Title, TopBar } from '@/components'
import LeaveCard from '@/components/LeaveCard/LeaveCard'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import Pds from '@/components/Pds/Pds'
import UserRequests from '@/components/Tracker/UserRequests'
import Cto from '@/components/Cto/Cto'
import { useSupabase } from '@/context/SupabaseProvider'
import type { DesignationTypes, Employee } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { type ChangeEvent, useEffect, useState } from 'react'
import Avatar from 'react-avatar'
import ServiceRecords from '@/components/ServiceRecords/page'
import ServiceCredits from '@/components/ServiceCredits/ServiceCredits'
import Promotions from '@/components/Promotions/Promotions'
import { format } from 'date-fns'
import Pdf from '@/components/Pdf/Pdf'
import ProfileDashboard from '@/components/ProfileDashboard'
import { generateReferenceCode } from '@/utils/text-helper'

export default function Page ({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<Employee | null>(null)

  const userId = params.id
  const searchParams = useSearchParams()
  const page = searchParams.get('page')

  // Avatar
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')

  // counters
  const [myctoCount, setMyctoCount] = useState('')

  const { supabase, session } = useSupabase()

  const router = useRouter()

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

  const handleUploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        setUploading(true)

        // delete the existing user avatar on supabase storage
        const { data: files, error: error3 } = await supabase.storage.from('hrm_public').list(`user_avatar/${userId}`)
        if (error3) throw new Error(error3.message)
        if (files.length > 0) {
          const filesToRemove = files.map((x: { name: string }) => `user_avatar/${userId}/${x.name}`)
          const { error: error4 } = await supabase.storage.from('hrm_public').remove(filesToRemove)
          if (error4) throw new Error(error4.message)
        }

        // upload the new avatar
        const file = e.target.files?.[0]
        const newFileName = generateReferenceCode()
        const customFilePath = `user_avatar/${userId}/${newFileName}.` + (file.name.split('.').pop() as string)
        const { error } = await supabase
          .storage
          .from('hrm_public')
          .upload(`${customFilePath}`, file, {
            cacheControl: '3600',
            upsert: true
          })
        if (error) throw new Error(error.message)

        // get the newly uploaded file public path
        await handleFetchAvatar(customFilePath)
      } catch (error) {
        console.error('Error uploading file:', error)
      } finally {
        router.refresh()
        setUploading(false)
      }
    }
  }

  const handleFetchAvatar = async (path: string) => {
    try {
      // get the public avatar url
      const { data, error } = await supabase
        .storage
        .from('hrm_public')
        .getPublicUrl(`${path}`)

      if (error) throw new Error(error.message)

      // update avatar url on hrm_users table
      const { error2 } = await supabase
        .from('hrm_users')
        .update({ avatar_url: data.publicUrl })
        .eq('id', userId)

      if (error2) throw new Error(error2.message)

      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
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

        setAvatarUrl(data?.avatar_url)
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
      {
        (!loading && userData) &&
          <>
            <div className="px-2 mt-12">
              <div>
                  {
                    (avatarUrl && avatarUrl !== '')
                      ? <div className='flex items-center justify-center relative'>
                          <div className='relative rounded-full overflow-hidden h-32 w-32 border border-gray-300'>
                            <Image src={avatarUrl} layout="fill" objectFit="cover" alt="profile image" className="rounded"/>
                          </div>
                          {
                            userId === session.user.id &&
                              <div className="absolute bottom-2 right-12">
                                <input type="file" onChange={handleUploadPhoto} className="hidden" id="file-input" accept="image/*"/>
                                {
                                  !uploading
                                    ? <div className="text-gray-300 bg-gray-700 rounded-full p-1">
                                        <label htmlFor="file-input" className='cursor-pointer'>
                                          <BsCamera className='w-5 h-5'/>
                                        </label>
                                      </div>
                                    : <span className='py-px px-1 text-xs text-white'>Uploading...</span>
                                }
                              </div>
                          }
                        </div>
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
                      href={`/profile/${userId}`}
                      className={`app__profile_menu_link ${(!page || page === '') ? 'bg-gray-700' : ''}`}>
                      <span className="flex-1 ml-3 whitespace-nowrap">Dashboard</span>
                    </Link>
                </li>
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
      {
        !loading &&
          <div>
            {
              (!page || page === '') &&
                <ProfileDashboard userId={userId}/>
            }
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
                <UserRequests forDashboard={false} userId={userId}/>
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
      }
    </div>
    </>
  )
}
