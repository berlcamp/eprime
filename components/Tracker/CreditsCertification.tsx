import { CustomButton, LeaveBalanceBoxes } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { CtoUserTypes, DocumentTypes, LeaveCreditTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

interface PropTypes {
  documentData: DocumentTypes
}

interface boxes {
  type: string
  balance: number
}

interface CtosTypes {
  id: string
  coc: number
  use_coc: string
  expiration: string
}

interface FormTypes {
  vl: string
  sl: string
  coc: string
  sc: string
  adoption: string
  vawc: string
  emergency: string
  study: string
  soloparent: string
  slbw: string
  spl: string
  rehab: string
  paternity: string
  maternity: string
  cocs: CtosTypes[]
}

export default function CreditsCertification({ documentData }: PropTypes) {
  const { supabase, session } = useSupabase()
  const { setToast, hasAccess } = useFilter()
  const [saving, setSaving] = useState(false)

  const [creditsUsed, setCreditsUsed] = useState<boxes[] | []>([])
  const [leaveCreditBalances, setLeaveCreditBalances] = useState<
    LeaveCreditTypes[] | []
  >([])

  const [withPay, setWithPay] = useState(0)
  const [withoutPay, setWithoutPay] = useState(Number(documentData.leave_days))

  const {
    register,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
    handleSubmit
  } = useForm<FormTypes>({
    mode: 'onSubmit'
  })

  const { fields } = useFieldArray({
    control,
    name: 'cocs'
  })

  const [
    vl,
    sl,
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
    maternity,
    cocs
  ] = watch([
    'vl',
    'sl',
    'coc',
    'sc',
    'adoption',
    'vawc',
    'emergency',
    'study',
    'soloparent',
    'slbw',
    'spl',
    'rehab',
    'paternity',
    'maternity',
    'cocs'
  ])

  const onSubmit = async (formdata: FormTypes) => {
    if (saving) return

    setSaving(true)
    void saveCertifications(formdata)
  }

  // update certifications of leave credits
  const saveCertifications = async (formdata: FormTypes) => {
    const newData = {
      leave_credit_use_vl:
        formdata.vl && Number(formdata.vl) > 0 ? formdata.vl : null,
      leave_credit_use_sl:
        formdata.sl && Number(formdata.sl) > 0 ? formdata.sl : null,
      leave_credit_use_coc:
        formdata.coc && Number(formdata.coc) > 0 ? formdata.coc : null,
      leave_credit_use_sc:
        formdata.sc && Number(formdata.sc) > 0 ? formdata.sc : null,

      leave_credit_use_adoption:
        formdata.adoption && Number(formdata.adoption) > 0
          ? formdata.adoption
          : null,
      leave_credit_use_vawc:
        formdata.vawc && Number(formdata.vawc) > 0 ? formdata.vawc : null,
      leave_credit_use_emergency:
        formdata.emergency && Number(formdata.emergency) > 0
          ? formdata.emergency
          : null,
      leave_credit_use_study:
        formdata.study && Number(formdata.study) > 0 ? formdata.study : null,
      leave_credit_use_soloparent:
        formdata.soloparent && Number(formdata.soloparent) > 0
          ? formdata.soloparent
          : null,
      leave_credit_use_slbw:
        formdata.slbw && Number(formdata.slbw) > 0 ? formdata.slbw : null,
      leave_credit_use_spl:
        formdata.spl && Number(formdata.spl) > 0 ? formdata.spl : null,
      leave_credit_use_rehab:
        formdata.rehab && Number(formdata.rehab) > 0 ? formdata.rehab : null,
      leave_credit_use_paternity:
        formdata.paternity && Number(formdata.paternity) > 0
          ? formdata.paternity
          : null,
      leave_credit_use_maternity:
        formdata.maternity && Number(formdata.maternity) > 0
          ? formdata.maternity
          : null,
      leave_days_with_pay: withPay,
      leave_days_without_pay: withoutPay
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

      // Prepare data for table update Leave CTO
      const updatedCtoData = formdata.cocs.map(
        (field: { id: string; use_coc: string }) => ({
          tracker_id: documentData.id,
          user_cto_id: field.id,
          use_coc: field.use_coc
        })
      )
      await supabase
        .from('hrm_leave_coc')
        .delete()
        .eq('tracker_id', documentData.id)

      const { error: insertCtoError } = await supabase
        .from('hrm_leave_coc')
        .insert(updatedCtoData)

      if (insertCtoError) {
        void logError(
          'Update cto coc credit used on leave',
          'hrm_request_trackers',
          JSON.stringify(updatedCtoData),
          insertCtoError.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(insertCtoError.message)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const balances: Array<{ type: string; balance: number }> = []
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
    console.log('balances', balances)

    let withpay = 0
    balances.forEach((b) => {
      withpay += Number(b.balance)
    })

    const total = cocs
      ? cocs.reduce((acc, curr) => acc + (parseFloat(curr.use_coc) || 0), 0)
      : 0

    withpay += total

    const withoutpay = Number(documentData.leave_days) - withpay

    setWithPay(withpay)
    setWithoutPay(withoutpay >= 0 ? withoutpay : 0)
  }, [
    vl,
    sl,
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
    maternity,
    cocs
  ])

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      vl: documentData.leave_credit_use_vl
        ? documentData.leave_credit_use_vl
        : '',
      sl: documentData.leave_credit_use_sl
        ? documentData.leave_credit_use_sl
        : '',
      coc: documentData.leave_credit_use_coc
        ? documentData.leave_credit_use_coc
        : '',
      sc: documentData.leave_credit_use_sc
        ? documentData.leave_credit_use_sc
        : '',
      adoption: documentData.leave_credit_use_adoption
        ? documentData.leave_credit_use_adoption
        : '',
      vawc: documentData.leave_credit_use_vawc
        ? documentData.leave_credit_use_vawc
        : '',
      emergency: documentData.leave_credit_use_emergency
        ? documentData.leave_credit_use_emergency
        : '',
      study: documentData.leave_credit_use_study
        ? documentData.leave_credit_use_study
        : '',
      soloparent: documentData.leave_credit_use_soloparent
        ? documentData.leave_credit_use_soloparent
        : '',
      slbw: documentData.leave_credit_use_slbw
        ? documentData.leave_credit_use_slbw
        : '',
      spl: documentData.leave_credit_use_spl
        ? documentData.leave_credit_use_spl
        : '',
      rehab: documentData.leave_credit_use_rehab
        ? documentData.leave_credit_use_rehab
        : '',
      paternity: documentData.leave_credit_use_paternity
        ? documentData.leave_credit_use_paternity
        : '',
      maternity: documentData.leave_credit_use_maternity
        ? documentData.leave_credit_use_maternity
        : ''
    })
  }, [documentData])

  useEffect(() => {
    const fetchBalances = async () => {
      const { data } = await supabase
        .from('hrm_leave_credits')
        .select()
        .eq('user_id', documentData.creator.id)
      setLeaveCreditBalances(data)
    }
    void fetchBalances()
  }, [])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('hrm_cto_users')
        .select()
        .eq('hrm_user_id', documentData.creator.id)
        .gte('expiration', new Date().toISOString())
        .gt('coc', 0)
      const bal: CtosTypes[] = []

      if (data) {
        const ctos: CtoUserTypes[] = data
        ctos.forEach((cto) => {
          if (cto.status !== 'Expired') {
            bal.push({
              id: cto.id,
              coc: cto.coc,
              expiration: cto.expiration,
              use_coc: ''
            })
          }
        })
      }
      // Populate dynamic fields in the form
      const cocsValues = bal.map((item) => ({
        id: item.id,
        coc: item.coc,
        use_coc:
          documentData.leave_cocs?.find(
            (lcoc) => lcoc.user_cto_id.toString() === item.id.toString()
          )?.use_coc ?? '',
        expiration: item.expiration
      }))

      setValue('cocs', cocsValues)
    })()
  }, [])

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
            documentData.current_status !== 'Approved' &&
            documentData.current_status !== 'Cancelled' && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="text-gray-600 text-xs mt-4 mb-2">
                  Use the following credits for this Leave:
                </div>
                <div className="text-gray-600 text-xs space-y-2">
                  {documentData.creator.position_type !== 'Teaching' && (
                    <>
                      {fields.map((field, index) => (
                        <div
                          key={index}
                          className="flex space-x-2 items-center"
                        >
                          <span className="font-bold">
                            CTO (COC Balance: {field.coc}, Exp.{' '}
                            {field.expiration}):
                          </span>
                          <input
                            {...register(`cocs.${index}.use_coc`, {
                              max: {
                                value: field.coc,
                                message: `Cannot exceed ${field.coc}`
                              }
                            })}
                            type="number"
                            step="any"
                            className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                          />
                          <input
                            {...field}
                            type="hidden" // Hidden input to preserve the ID
                          />
                          {errors.cocs?.[index]?.use_coc?.message && (
                            <div className="app__error_message">
                              {errors.cocs?.[index]?.use_coc?.message}
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Vacation Leave:</span>
                        <input
                          {...register('vl', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Vacation Leave'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Vacation Leave'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.vl?.message && (
                          <div className="app__error_message">
                            {errors.vl.message}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Sick Leave:</span>
                        <input
                          {...register('sl', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Sick Leave'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Sick Leave'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.sl?.message && (
                          <div className="app__error_message">
                            {errors.sl.message}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">COC Leave:</span>
                        <input
                          {...register('coc', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) =>
                                    b.type === 'Compensatory Overtime Credit'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) =>
                                    b.type === 'Compensatory Overtime Credit'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.coc?.message && (
                          <div className="app__error_message">
                            {errors.coc.message}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {documentData.creator.position_type === 'Teaching' && (
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Service Credit:</span>
                      <input
                        {...register('sc', {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === 'Service Credit'
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === 'Service Credit'
                              )?.credits
                            }`
                          }
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.sc?.message && (
                        <div className="app__error_message">
                          {errors.sc.message}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Adoption Leave:</span>
                    <input
                      {...register('adoption', {
                        max: {
                          value:
                            leaveCreditBalances.find(
                              (b) => b.type === 'Adoption Leave'
                            )?.credits ?? 0,
                          message: `Cannot exceed ${
                            leaveCreditBalances.find(
                              (b) => b.type === 'Adoption Leave'
                            )?.credits
                          }`
                        }
                      })}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                    {errors.adoption?.message && (
                      <div className="app__error_message">
                        {errors.adoption.message}
                      </div>
                    )}
                  </div>

                  {/* Female */}
                  {documentData.creator.gender.toLowerCase() === 'female' && (
                    <>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">VAWC Leave:</span>
                        <input
                          {...register('vawc', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) => b.type === '10-Day VAWC Leave'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) => b.type === '10-Day VAWC Leave'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.vawc?.message && (
                          <div className="app__error_message">
                            {errors.vawc.message}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">
                          Special Leave Benefits for Women Leave:
                        </span>
                        <input
                          {...register('slbw', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) =>
                                    b.type ===
                                    'Special Leave Benefits For Women'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) =>
                                    b.type ===
                                    'Special Leave Benefits For Women'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.slbw?.message && (
                          <div className="app__error_message">
                            {errors.slbw.message}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Maternity Leave:</span>
                        <input
                          {...register('maternity', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Maternity Leave'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Maternity Leave'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.maternity?.message && (
                          <div className="app__error_message">
                            {errors.maternity.message}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Male */}
                  {documentData.creator.gender.toLowerCase() === 'male' && (
                    <>
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Paternity Leave:</span>
                        <input
                          {...register('paternity', {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Paternity Leave'
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) => b.type === 'Paternity Leave'
                                )?.credits
                              }`
                            }
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.paternity?.message && (
                          <div className="app__error_message">
                            {errors.paternity.message}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Special Emergency Leave:</span>
                    <input
                      {...register('emergency', {
                        max: {
                          value:
                            leaveCreditBalances.find(
                              (b) =>
                                b.type === 'Special Emergency (Calamity) Leave'
                            )?.credits ?? 0,
                          message: `Cannot exceed ${
                            leaveCreditBalances.find(
                              (b) =>
                                b.type === 'Special Emergency (Calamity) Leave'
                            )?.credits
                          }`
                        }
                      })}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                    {errors.emergency?.message && (
                      <div className="app__error_message">
                        {errors.emergency.message}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Study Leave:</span>
                    <input
                      {...register('study', {
                        max: {
                          value:
                            leaveCreditBalances.find(
                              (b) => b.type === 'Study Leave'
                            )?.credits ?? 0,
                          message: `Cannot exceed ${
                            leaveCreditBalances.find(
                              (b) => b.type === 'Study Leave'
                            )?.credits
                          }`
                        }
                      })}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                    {errors.study?.message && (
                      <div className="app__error_message">
                        {errors.study.message}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Solo Parent Leave:</span>
                    <input
                      {...register('soloparent', {
                        max: {
                          value:
                            leaveCreditBalances.find(
                              (b) => b.type === 'Solo Parent Leave'
                            )?.credits ?? 0,
                          message: `Cannot exceed ${
                            leaveCreditBalances.find(
                              (b) => b.type === 'Solo Parent Leave'
                            )?.credits
                          }`
                        }
                      })}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                    {errors.soloparent?.message && (
                      <div className="app__error_message">
                        {errors.soloparent.message}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Special Privilege Leave:</span>
                    <input
                      {...register('spl', {
                        max: {
                          value:
                            leaveCreditBalances.find(
                              (b) => b.type === 'Special Privilege Leave'
                            )?.credits ?? 0,
                          message: `Cannot exceed ${
                            leaveCreditBalances.find(
                              (b) => b.type === 'Special Privilege Leave'
                            )?.credits
                          }`
                        }
                      })}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                    {errors.spl?.message && (
                      <div className="app__error_message">
                        {errors.spl.message}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 items-center">
                    <span className="font-bold">Rehabilitation Leave:</span>
                    <input
                      {...register('rehab', {
                        max: {
                          value:
                            leaveCreditBalances.find(
                              (b) => b.type === 'Rehabilitation Leave'
                            )?.credits ?? 0,
                          message: `Cannot exceed ${
                            leaveCreditBalances.find(
                              (b) => b.type === 'Rehabilitation Leave'
                            )?.credits
                          }`
                        }
                      })}
                      type="number"
                      step="any"
                      className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                    />
                    {errors.rehab?.message && (
                      <div className="app__error_message">
                        {errors.rehab.message}
                      </div>
                    )}
                  </div>
                </div>

                <CustomButton
                  containerStyles="app__btn_green mt-2"
                  title="Save Changes"
                  isDisabled={
                    saving || withPay > Number(documentData.leave_days)
                  }
                  btnType="submit"
                />
              </form>
            )}
          <div className="text-gray-600 text-xs mt-4">
            Credits used for this Leave:
          </div>
          <div className="text-gray-600 text-xs mt-1 font-bold mb-2 space-y-1">
            {fields.map((_field, index) => (
              <div
                key={index}
                className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2"
              >
                COC: {cocs?.[index]?.use_coc || 0}{' '}
                {/* Display the current input value */}
              </div>
            ))}
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
