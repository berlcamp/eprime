import React, { useEffect, useState } from 'react'
import type { DocumentTypes } from '@/types'
import { CustomButton, LeaveBalanceBoxes } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'

interface PropTypes {
  documentData: DocumentTypes
}

interface boxes {
  type: string
  balance: number
}

export default function CreditsCertification ({ documentData }: PropTypes) {
  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const [creditsUsed, setCreditsUsed] = useState<boxes[] | []>([])

  const [vl, setVl] = useState(documentData.leave_credit_use_vl ? documentData.leave_credit_use_vl : '')
  const [sl, setSl] = useState(documentData.leave_credit_use_sl ? documentData.leave_credit_use_sl : '')
  const [coc, setCoc] = useState(documentData.leave_credit_use_coc ? documentData.leave_credit_use_coc : '')
  const [sc, setSc] = useState(documentData.leave_credit_use_sc ? documentData.leave_credit_use_sc : '')

  const [withPay, setWithPay] = useState(0)
  const [withoutPay, setWithoutPay] = useState(Number(documentData.leave_days))

  // update certifications of leave credits
  const saveCertifications = async () => {
    const newData = {
      leave_credit_use_vl: vl !== '' ? vl : null,
      leave_credit_use_sl: sl !== '' ? sl : null,
      leave_credit_use_coc: coc !== '' ? coc : null,
      leave_credit_use_sc: sc !== '' ? sc : null
    }

    try {
      const { error } = await supabase
        .from('hrm_request_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError('Update leave credit used on leave', 'hrm_request_trackers', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const balances = []
    if (Number(sl) > 0) {
      balances.push({ type: 'SL', balance: Number(sl) })
    }
    if (Number(vl) > 0) {
      balances.push({ type: 'VL', balance: Number(vl) })
    }
    if (Number(coc) > 0) {
      balances.push({ type: 'COC', balance: Number(coc) })
    }
    if (Number(sc) > 0) {
      balances.push({ type: 'Service Credit', balance: Number(sc) })
    }
    setCreditsUsed(balances)

    const withpay = (Number(sl) + Number(vl) + Number(coc) + Number(sc))
    const withoutpay = Number(documentData.leave_days) - (Number(sl) + Number(vl) + Number(coc) + Number(sc))

    setWithPay(withpay)
    setWithoutPay(withoutpay >= 0 ? withoutpay : 0)
  }, [sl, vl, coc, sc])

  return (
    <div className='w-full px-4'>
      <div className="flex items-center">
        <div className="flex-grow bg-gray-300 h-px"></div>
        <div className="mx-4 my-4 text-gray-500 text-sm">Certification of leave credits</div>
        <div className="flex-grow bg-gray-300 h-px"></div>
      </div>
      <div className='app__form_field_container'>
        <div className='w-full'>
          {
            // Only display if leave request is not yet approved, disapproved or cancelled
            (documentData.current_status !== 'Approved' && documentData.current_status !== 'Disapproved' && documentData.current_status !== 'Cancelled') &&
              <>
              <div className='text-gray-600 text-xs'>Requester current balance:</div>
              <div className='mt-2'>
                <LeaveBalanceBoxes user={documentData.creator}/>
              </div>
              </>
          }
          {
            (hasAccess('certify_leave_credits') && documentData.receiver_id === session.user.id && documentData.current_status === 'For Verification') &&
              <>
              <div className='text-gray-600 text-xs mt-4 mb-2'>Use the following credits for this Leave:</div>
              {
                documentData.creator.position_type === 'Non-teaching' &&
                  <div className='text-gray-600 text-xs space-y-2'>
                    <div className='flex space-x-2 items-center'>
                      <span className='font-bold'>VL:</span>
                      <input
                        value={vl}
                        onChange={e => setVl(e.target.value)}
                        type='number' step='any' className='px-1 py-px border border-gray-300 outline-none text-sm w-20'/>
                    </div>
                    <div className='flex space-x-2 items-center'>
                      <span className='font-bold'>SL:</span>
                      <input
                        value={sl}
                        onChange={e => setSl(e.target.value)}
                        type='number' step='any' className='px-1 py-px border border-gray-300 outline-none text-sm w-20'/>
                    </div>
                    <div className='flex space-x-2 items-center'>
                      <span className='font-bold'>COC:</span>
                      <input
                        value={coc}
                        onChange={e => setCoc(e.target.value)}
                        type='number' step='any' className='px-1 py-px border border-gray-300 outline-none text-sm w-20'/>
                    </div>
                  </div>
              }
              {
                documentData.creator.position_type === 'Teaching' &&
                  <div className='text-gray-600 text-xs space-y-2'>
                    <div className='flex space-x-2 items-center'>
                      <span className='font-bold'>Service Credits:</span>
                      <input
                        value={sc}
                        onChange={e => setSc(e.target.value)}
                        type='number' step='any' className='px-1 py-px border border-gray-300 outline-none text-sm w-20'/>
                    </div>
                  </div>
              }
              <CustomButton
                containerStyles='app__btn_green mt-2'
                title='Save Changes'
                isDisabled={withPay > Number(documentData.leave_days)}
                btnType='button'
                handleClick={saveCertifications}
              />
              </>
          }
          <div className='text-gray-600 text-xs mt-4'>Credits used for this Leave:</div>
          <div className='text-gray-600 text-xs mt-1 font-bold mb-2'>
            {
              creditsUsed.map((credit, index) => (
                <span key={index} className='border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2'>{credit.type}: {credit.balance}</span>
              ))
            }
          </div>
          <div className='text-gray-600 font-medium text-xs mt-4 mb-1'>Absence with Pay: {withPay} {withPay > Number(documentData.leave_days) && <span className='text-red-500'>(Exceeds to actual number of leave days)</span>}</div>
          <div className='text-gray-600 font-medium text-xs mt-4 mb-1'>Absence without Pay: {withoutPay}</div>
        </div>
      </div>
    </div>
  )
}
