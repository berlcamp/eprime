/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TableCellsIcon } from '@heroicons/react/20/solid'
import { useFilter } from '@/context/FilterContext'
import { superAdmins } from '@/constants'
import { useSelector } from 'react-redux'
import { useSupabase } from '@/context/SupabaseProvider'
import { format } from 'date-fns'
import type { CtoTypes } from '@/types'

const RecordsSideBar = () => {
  const currentRoute = usePathname()

  // counters
  const [myctoCount, setMyctoCount] = useState('')
  const [ctoCount, setCtoCount] = useState('')
  const [promotionsCount, setPromotionsCount] = useState('')

  const { hasAccess } = useFilter()
  const { supabase, session } = useSupabase()

  // Redux staff
  const recountStatus = useSelector((state: any) => state.recount.value)

  const counter = async () => {
    const today = new Date()

    // add 1 month
    const filterDate = format(new Date(today.setMonth(today.getMonth() + 1)), 'yyyy-MM-dd')

    const { count: ctoCounter } = await supabase
      .from('hrm_cto_users')
      .select('id', { count: 'exact' })
      .eq('hrm_user_id', session.user.id)
      .is('status', null)
      .lte('expiration', filterDate)

    setMyctoCount(`Expiring soon (${ctoCounter})`)

    if (hasAccess('sds')) {
      const { count: promotionCount } = await supabase
        .from('hrm_promotions')
        .select('id', { count: 'exact' })
        .eq('status', 'For Final Approval')

      if (promotionCount > 0) setPromotionsCount(`${promotionCount} for Approval`)
    } else if (hasAccess('verify_promotions')) {
      const { count: promotionCount } = await supabase
        .from('hrm_promotions')
        .select('id', { count: 'exact' })
        .eq('status', 'For Verification')

      if (promotionCount > 0) setPromotionsCount(`For Verification (${promotionCount})`)
    }

    if (hasAccess('cto_sc_approver')) {
      const { data } = await supabase
        .from('hrm_ctos')
        .select('status, hrm_cto_users(status, is_approved)')
        .is('status', null)

      if (data) {
        let count = 0
        const ctos: CtoTypes[] = data
        ctos.forEach(item => {
          const users = item.hrm_cto_users?.filter(user => !user.is_approved)
          count += users ? users.length : 0
        })
        if (count > 0) {
          setCtoCount(`For Approval (${count})`)
        }
      }
    }
  }
  useEffect(() => {
    void counter()
  }, [recountStatus])

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        <li>
          <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
            <TableCellsIcon className='w-4 h-4'/>
            <span>My Records</span>
          </div>
        </li>
        <li>
          <Link href={`/myservicerecords/${session.user.id}`}
            className={`app__menu_link ${currentRoute.includes('myservicerecords') ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">My Service Records</span>
          </Link>
        </li>
        <li>
          <Link
            href="/myctos"
            className={`app__menu_link ${currentRoute.includes('myctos') ? 'app_menu_link_active' : ''}`}>
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
            href="/myservicecredits"
            className={`app__menu_link ${currentRoute === '/myservicecredits' ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Service Credits</span>
          </Link>
        </li>
        <li>
          <Link
            href="/mypromotions"
            className={`app__menu_link ${currentRoute === '/mypromotions' ? 'app_menu_link_active' : ''}`}>
            <span className="flex-1 ml-3 whitespace-nowrap">Promotions</span>
          </Link>
        </li>
      </ul>
      {
        // Check access from permission settings or Super Admins
        (hasAccess('records') || superAdmins.includes(session.user.email)) &&
          <ul className="pt-8 mt-4 space-y-2 border-gray-700">
            <li>
              <div className='flex items-center text-gray-500 items-centers space-x-1 px-2'>
                <TableCellsIcon className='w-4 h-4'/>
                <span>HR Records</span>
              </div>
            </li>
            <li>
              <Link
                href="/servicerecords"
                className={`app__menu_link ${currentRoute === '/servicerecords' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Service Records</span>
              </Link>
            </li>
            <li>
              <Link
                href="/assignments"
                className={`app__menu_link ${currentRoute === '/assignments' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Assignments</span>
              </Link>
            </li>
            <li>
              <Link
                href="/designations"
                className={`app__menu_link ${currentRoute === '/designations' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Designations</span>
              </Link>
            </li>
            <li>
              <Link
                href="/ctos"
                className={`app__menu_link ${currentRoute === '/ctos' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">CTO</span>
                {
                  ctoCount !== '' &&
                    <span className='inline-flex items-center justify-center rounded-lg bg-red-500'>
                      <span className='px-1 text-white text-xs'>{ctoCount}</span>
                    </span>

                }
              </Link>
            </li>
            <li>
              <Link
                href="/servicecredits"
                className={`app__menu_link ${currentRoute === '/servicecredits' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Service Credits</span>
              </Link>
            </li>
            <li>
              <Link
                href="/promotions"
                className={`app__menu_link ${currentRoute === '/promotions' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Promotions</span>
                {
                  promotionsCount !== '' &&
                    <span className='inline-flex items-center justify-center rounded-lg bg-red-500'>
                      <span className='px-1 text-white text-xs'>{promotionsCount}</span>
                    </span>

                }
              </Link>
            </li>
            <li>
              <Link
                href="/items"
                className={`app__menu_link ${currentRoute === '/items' ? 'app_menu_link_active' : ''}`}>
                <span className="flex-1 ml-3 whitespace-nowrap">Plantilla Items</span>
              </Link>
            </li>
          </ul>
      }
    </>
  )
}

export default RecordsSideBar
