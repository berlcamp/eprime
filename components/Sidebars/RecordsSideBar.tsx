/* eslint-disable @typescript-eslint/restrict-template-expressions */
'use client'

import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { CtoTypes, ServiceCreditTypes } from '@/types'
import { TableCellsIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const RecordsSideBar = () => {
  const currentRoute = usePathname()
  const [ctoCount, setCtoCount] = useState('')
  const [scCount, setScCount] = useState('')
  const [registrationCount, setRegistrationCount] = useState('')
  const [promotionsCount, setPromotionsCount] = useState('')

  const { hasAccess } = useFilter()
  const { supabase } = useSupabase()

  // Redux staff
  const recountStatus = useSelector((state: any) => state.recount.value)

  const counter = async () => {
    if (hasAccess('sds')) {
      const { count: promotionCount } = await supabase
        .from('hrm_promotions')
        .select('id', { count: 'exact' })
        .eq('status', 'For Final Approval')

      if (promotionCount > 0)
        setPromotionsCount(`For Approval (${promotionCount})`)
    } else if (hasAccess('verify_promotions')) {
      const { count: promotionCount } = await supabase
        .from('hrm_promotions')
        .select('id', { count: 'exact' })
        .eq('status', 'For Verification')

      if (promotionCount > 0)
        setPromotionsCount(`For Verification (${promotionCount})`)
    }

    if (hasAccess('cto_sc_approver')) {
      // CTO Counter
      const { data } = await supabase
        .from('hrm_ctos')
        .select('status, hrm_cto_users(is_approved)')
        .is('status', null)
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (data) {
        let count = 0
        const ctos: CtoTypes[] = data
        ctos.forEach((item) => {
          const users = item.hrm_cto_users?.filter((user) => !user.is_approved)
          count += users ? users.length : 0
        })
        if (count > 0) {
          setCtoCount(`For Approval (${count})`)
        }
      }

      // SC Counter
      const { data: scData } = await supabase
        .from('hrm_service_credits')
        .select('status, hrm_service_credit_users(is_approved)')
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      if (scData) {
        let count = 0
        const sc: ServiceCreditTypes[] = scData
        sc.forEach((item) => {
          const users = item.hrm_service_credit_users?.filter(
            (user) => !user.is_approved
          )
          count += users ? users.length : 0
        })
        if (count > 0) {
          setScCount(`For Approval (${count})`)
        }
      }

      // Registrations counter
      const { count: registrationsCount } = await supabase
        .from('hrm_registrations')
        .select('id', { count: 'exact' })

      if (registrationsCount > 0) setRegistrationCount(registrationsCount)
    }
  }
  useEffect(() => {
    void counter()
  }, [recountStatus])

  return (
    <>
      {
        // Check access from permission settings or Super Admins
        hasAccess('records') && (
          <ul className="pt-8 mt-4 space-y-2 border-gray-700">
            <li>
              <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
                <TableCellsIcon className="w-4 h-4" />
                <span>HR Records</span>
              </div>
            </li>
            <li>
              <Link
                href="/employees"
                className={`app__menu_link ${
                  currentRoute === '/employees' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">Employees</span>
              </Link>
            </li>
            <li>
              <Link
                href="/registrations"
                className={`app__menu_link ${
                  currentRoute === '/registrations'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Registrations
                </span>
                {registrationCount !== '' && (
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500">
                    <span className="text-white text-[10px]">
                      {registrationCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/servicerecords"
                className={`app__menu_link ${
                  currentRoute === '/servicerecords'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Service Records
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/assignments"
                className={`app__menu_link ${
                  currentRoute === '/assignments' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Assignments
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/designations"
                className={`app__menu_link ${
                  currentRoute === '/designations' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Designations
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/ctos"
                className={`app__menu_link ${
                  currentRoute === '/ctos' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">CTO</span>
                {ctoCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-lg bg-red-500">
                    <span className="px-1 text-white text-[10px]">
                      {ctoCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/servicecredits"
                className={`app__menu_link ${
                  currentRoute === '/servicecredits'
                    ? 'app_menu_link_active'
                    : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Service Credits
                </span>
                {scCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-lg bg-red-500">
                    <span className="px-1 text-white text-[10px]">
                      {scCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/promotions"
                className={`app__menu_link ${
                  currentRoute === '/promotions' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Promotions
                </span>
                {promotionsCount !== '' && (
                  <span className="inline-flex items-center justify-center rounded-lg bg-red-500">
                    <span className="px-1 text-white text-[10px]">
                      {promotionsCount}
                    </span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/items"
                className={`app__menu_link ${
                  currentRoute === '/items' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Plantilla Items
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/nosi"
                className={`app__menu_link ${
                  currentRoute === '/nosi' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">NOSI</span>
              </Link>
            </li>
            <li>
              <Link
                href="/nosa"
                className={`app__menu_link ${
                  currentRoute === '/nosa' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">NOSA</span>
              </Link>
            </li>
          </ul>
        )
      }
    </>
  )
}

export default RecordsSideBar
