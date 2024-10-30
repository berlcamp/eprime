import { CustomButton, LeaveBalanceBoxes } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { DocumentTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'

interface PropTypes {
  documentData: DocumentTypes
}

interface boxes {
  type: string
  balance: number
}

export default function CreditsCertification({ documentData }: PropTypes) {
  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()

  const [creditsUsed, setCreditsUsed] = useState<boxes[] | []>([])

  const [vl, setVl] = useState(
    documentData.leave_credit_use_vl ? documentData.leave_credit_use_vl : ''
  )
  const [sl, setSl] = useState(
    documentData.leave_credit_use_sl ? documentData.leave_credit_use_sl : ''
  )
  const [coc, setCoc] = useState(
    documentData.leave_credit_use_coc ? documentData.leave_credit_use_coc : ''
  )
  const [sc, setSc] = useState(
    documentData.leave_credit_use_sc ? documentData.leave_credit_use_sc : ''
  )

  const [adoption, setAdoption] = useState(
    documentData.leave_credit_use_adoption
      ? documentData.leave_credit_use_adoption
      : ''
  )
  const [vawc, setVawc] = useState(
    documentData.leave_credit_use_vawc ? documentData.leave_credit_use_vawc : ''
  )
  const [emergency, setEmergency] = useState(
    documentData.leave_credit_use_emergency
      ? documentData.leave_credit_use_emergency
      : ''
  )
  const [study, setStudy] = useState(
    documentData.leave_credit_use_study
      ? documentData.leave_credit_use_study
      : ''
  )
  const [soloparent, setSoloparent] = useState(
    documentData.leave_credit_use_soloparent
      ? documentData.leave_credit_use_soloparent
      : ''
  )
  const [slbw, setSlbw] = useState(
    documentData.leave_credit_use_slbw ? documentData.leave_credit_use_slbw : ''
  )
  const [spl, setSpl] = useState(
    documentData.leave_credit_use_spl ? documentData.leave_credit_use_spl : ''
  )
  const [rehab, setRehab] = useState(
    documentData.leave_credit_use_rehab
      ? documentData.leave_credit_use_rehab
      : ''
  )
  const [paternity, setPaternity] = useState(
    documentData.leave_credit_use_paternity
      ? documentData.leave_credit_use_paternity
      : ''
  )
  const [maternity, setMaternity] = useState(
    documentData.leave_credit_use_maternity
      ? documentData.leave_credit_use_maternity
      : ''
  )

  const [withPay, setWithPay] = useState(0)
  const [withoutPay, setWithoutPay] = useState(Number(documentData.leave_days))

  // update certifications of leave credits
  const saveCertifications = async () => {
    const newData = {
      leave_credit_use_vl: vl !== '' ? vl : null,
      leave_credit_use_sl: sl !== '' ? sl : null,
      leave_credit_use_coc: coc !== '' ? coc : null,
      leave_credit_use_sc: sc !== '' ? sc : null,

      leave_credit_use_adoption: adoption !== '' ? adoption : null,
      leave_credit_use_vawc: vawc !== '' ? vawc : null,
      leave_credit_use_emergency: emergency !== '' ? emergency : null,
      leave_credit_use_study: study !== '' ? study : null,
      leave_credit_use_soloparent: soloparent !== '' ? soloparent : null,
      leave_credit_use_slbw: slbw !== '' ? slbw : null,
      leave_credit_use_spl: spl !== '' ? spl : null,
      leave_credit_use_rehab: rehab !== '' ? rehab : null,
      leave_credit_use_paternity: paternity !== '' ? paternity : null,
      leave_credit_use_maternity: maternity !== '' ? maternity : null
    }

    try {
      const { error } = await supabase
        .from('hrm_request_trackers')
        .update(newData)
        .eq('id', documentData.id)

      if (error) {
        void logError(
          'Update leave credit used on leave',
          'hrm_request_trackers',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
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
    if (Number(adoption) > 0) {
      balances.push({ type: 'adoption', balance: Number(adoption) })
    }
    if (Number(vawc) > 0) {
      balances.push({ type: 'vawc', balance: Number(vawc) })
    }
    if (Number(emergency) > 0) {
      balances.push({ type: 'emergency', balance: Number(emergency) })
    }
    if (Number(study) > 0) {
      balances.push({ type: 'study', balance: Number(study) })
    }
    if (Number(soloparent) > 0) {
      balances.push({ type: 'soloparent', balance: Number(soloparent) })
    }
    if (Number(slbw) > 0) {
      balances.push({ type: 'slbw', balance: Number(slbw) })
    }
    if (Number(spl) > 0) {
      balances.push({ type: 'spl', balance: Number(spl) })
    }
    if (Number(rehab) > 0) {
      balances.push({ type: 'rehab', balance: Number(rehab) })
    }
    if (Number(paternity) > 0) {
      balances.push({ type: 'paternity', balance: Number(paternity) })
    }
    if (Number(maternity) > 0) {
      balances.push({ type: 'maternity', balance: Number(maternity) })
    }
    setCreditsUsed(balances)

    const withpay = Number(sl) + Number(vl) + Number(coc) + Number(sc)
    const withoutpay =
      Number(documentData.leave_days) -
      (Number(sl) + Number(vl) + Number(coc) + Number(sc))

    setWithPay(withpay)
    setWithoutPay(withoutpay >= 0 ? withoutpay : 0)
  }, [
    sl,
    vl,
    coc,
    sc,
    adoption,
    vawc,
    emergency,
    study,
    soloparent,
    slbw,
    spl,
    rehab,
    paternity,
    maternity
  ])

  return (
    <div className="w-full px-4">
      <div className="flex items-center">
        <div className="flex-grow bg-gray-300 h-px"></div>
        <div className="mx-4 my-4 text-gray-500 text-sm">
          Certification of leave credits
        </div>
        <div className="flex-grow bg-gray-300 h-px"></div>
      </div>
      <div className="app__form_field_container">
        <div className="w-full">
          {
            // Only display if leave request is not yet approved, disapproved or cancelled
            documentData.current_status !== 'Approved' &&
              documentData.current_status !== 'Disapproved' &&
              documentData.current_status !== 'Cancelled' && (
                <>
                  <div className="text-gray-600 text-xs">
                    Requester current balance:
                  </div>
                  <div className="mt-2">
                    <LeaveBalanceBoxes user={documentData.creator} />
                  </div>
                </>
              )
          }
          {hasAccess('certify_leave_credits') &&
            documentData.receiver_id === session.user.id &&
            documentData.current_status !== 'Disapproved' &&
            documentData.current_status !== 'Cancelled' && (
              <>
                <div className="text-gray-600 text-xs mt-4 mb-2">
                  Use the following credits for this Leave:
                </div>
                <div className="text-gray-600 text-xs space-y-2">
                  {documentData.creator.position_type === 'Non-teaching' && (
                    <>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Vacation Leave:</span>
                        <input
                          value={vl}
                          onChange={(e) => setVl(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Sick Leave:</span>
                        <input
                          value={sl}
                          onChange={(e) => setSl(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">COC:</span>
                        <input
                          value={coc}
                          onChange={(e) => setCoc(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>
                    </>
                  )}
                  {documentData.creator.position_type === 'Teaching' && (
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Service Credits:</span>
                      <input
                        value={sc}
                        onChange={(e) => setSc(e.target.value)}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                    </div>
                  )}

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Adoption Leave:</span>
                    <input
                      value={adoption}
                      onChange={(e) => setAdoption(e.target.value)}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                  </div>

                  {/* Female */}
                  {documentData.creator.gender.toLowerCase() === 'female' && (
                    <>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">VAWC Leave:</span>
                        <input
                          value={vawc}
                          onChange={(e) => setVawc(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>

                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">
                          Special Leave Benefits for Women:
                        </span>
                        <input
                          value={slbw}
                          onChange={(e) => setSlbw(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>

                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Maternity Leave:</span>
                        <input
                          value={maternity}
                          onChange={(e) => setMaternity(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>
                    </>
                  )}

                  {/* Male */}
                  {documentData.creator.gender.toLowerCase() === 'male' && (
                    <>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Paternity Leave:</span>
                        <input
                          value={paternity}
                          onChange={(e) => setPaternity(e.target.value)}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Special Emergency Leave:</span>
                    <input
                      value={emergency}
                      onChange={(e) => setEmergency(e.target.value)}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Study Leave:</span>
                    <input
                      value={study}
                      onChange={(e) => setStudy(e.target.value)}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Solo Parent Leave:</span>
                    <input
                      value={soloparent}
                      onChange={(e) => setSoloparent(e.target.value)}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Special Privilege Leave:</span>
                    <input
                      value={spl}
                      onChange={(e) => setSpl(e.target.value)}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Rehabilitation Leave:</span>
                    <input
                      value={rehab}
                      onChange={(e) => setRehab(e.target.value)}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                  </div>
                </div>

                <CustomButton
                  containerStyles="app__btn_green mt-2"
                  title="Save Changes"
                  isDisabled={withPay > Number(documentData.leave_days)}
                  btnType="button"
                  handleClick={saveCertifications}
                />
              </>
            )}
          <div className="text-gray-600 text-xs mt-4">
            Credits used for this Leave:
          </div>
          <div className="text-gray-600 text-xs mt-1 font-bold mb-2 space-y-1">
            {creditsUsed.map((credit, index) => (
              <div
                key={index}
                className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2"
              >
                {credit.type}: {credit.balance}
              </div>
            ))}
          </div>
          <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
            Absence with Pay: {withPay}{' '}
            {withPay > Number(documentData.leave_days) && (
              <span className="text-red-500">
                (Exceeds to actual number of leave days)
              </span>
            )}
          </div>
          <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
            Absence without Pay: {withoutPay}
          </div>
        </div>
      </div>
    </div>
  )
}
