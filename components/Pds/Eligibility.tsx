import React, { useEffect, useState } from 'react'
import TwoColTableLoading from '../Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { useForm } from 'react-hook-form'
import { logError } from '@/utils/fetchApi'
import { useFilter } from '@/context/FilterContext'
import CustomButton from '../CustomButton'
import { nanoid } from 'nanoid'

interface FormRowTypes {
  nanoid: string
  eligibility: string
  rating: string
  exam_date: string
  exam_place: string
  license_number: string
  license_validity: string
}

interface EligibilityTypes {
  eligibility: string
  confirmed: string
}

export default function Eligibility ({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [eligibilityArray, setEligibilityArray] = useState<FormRowTypes[] | []>([])
  const [showAddRow, setShowAddRow] = useState(false)

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormRowTypes>({
    mode: 'onSubmit'
  })

  const { register: register2, formState: { errors: errors2 }, handleSubmit: handleSubmit2 } = useForm<EligibilityTypes>({
    mode: 'onSubmit'
  })

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setEligibilityArray([{
      nanoid: nanoid(),
      eligibility: formdata.eligibility,
      rating: formdata.rating,
      exam_date: formdata.exam_date,
      exam_place: formdata.exam_place,
      license_number: formdata.license_number,
      license_validity: formdata.license_validity
    }, ...eligibilityArray])

    reset()
    setShowAddRow(false)
  }

  const onSubmit = async (formdata: EligibilityTypes) => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      eligibility: eligibilityArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError('Update Eligibility PDS', 'hrm_pds', JSON.stringify(newData), error.message)
      setToast('error', 'Saving failed, please reload the page and try again.')
    } else {
      setToast('success', 'Successfully saved.')
    }

    setSaving(false)
  }

  const fetchData = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('hrm_pds')
      .select()
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (data) {
      // transfer the children json to state
      if (data.eligibility) {
        setEligibilityArray(data.eligibility)
      }
    }

    if (error) console.log(error.message)

    setLoading(false)
  }

  const HandleRemoveItem = (item: FormRowTypes) => {
    const updatedData = eligibilityArray.filter(e => (e.nanoid !== item.nanoid))
    setEligibilityArray(updatedData)
  }

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <div className='w-full'>
      { loading && <TwoColTableLoading/> }
      {
        !loading &&
          <div className="w-full">
            <div className='w-full px-4'>
              <div className="flex items-center">
                <div className="flex-grow bg-gray-300 h-px"></div>
                <div className="mx-4 my-4 text-gray-500 text-sm">Civil Service Eligibility</div>
                <div className="flex-grow bg-gray-300 h-px"></div>
              </div>
              <div className='w-full'>
                {
                  eligibilityArray.length > 0 &&
                    <table className='app__table mb-4'>
                      <thead className='app__thead'>
                        <tr>
                          <th className='app__th'>Eligibility</th>
                          <th className='app__th'>Rating</th>
                          <th className='app__th'>Date of Examination/Conferment</th>
                          <th className='app__th'>Place of Examination/Conferment</th>
                          <th className='app__th'>License No.</th>
                          <th className='app__th'>Date of Validity</th>
                          <th className='app__th'></th>
                        </tr>
                      </thead>
                      <tbody>
                      {
                        eligibilityArray.map((item, index) => (
                          <tr key={index} className='app__tr'>
                            <td className='app__td'>{item.eligibility}</td>
                            <td className='app__td'>{item.rating}</td>
                            <td className='app__td'>{item.exam_date}</td>
                            <td className='app__td'>{item.exam_place}</td>
                            <td className='app__td'>{item.license_number}</td>
                            <td className='app__td'>{item.license_validity}</td>
                            <td className='app__td'>
                              {
                                userId === session.user.id &&
                                  <CustomButton
                                    containerStyles='app__btn_red'
                                    title='Remove'
                                    btnType='button'
                                    handleClick={() => HandleRemoveItem(item)}
                                    />
                              }
                            </td>
                          </tr>
                        ))
                      }
                      </tbody>
                    </table>
                }
              </div>
            </div>
            {
              userId === session.user.id &&
                <>
                  <div className='app__pds_add_row_container'>
                    <form onSubmit={handleSubmit(onSubmitRow)} className="text-xs">
                      {
                        !showAddRow
                          ? <CustomButton
                              containerStyles='app__btn_blue'
                              title='Add Eligibility'
                              btnType='button'
                              handleClick={() => setShowAddRow(true)}
                              />
                          : <div className='w-2/3 space-y-4'>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Career / RA 1080 (BOARD/ BAR) Under Special Laws/ CES/ CSEE/ Barangay Eligibility/ DRIVER&apos;S LICENSE:</div>
                                <input
                                  {...register('eligibility', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.eligibility && <div className='app__error_message'>Eligibility is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Rating <span className='text-gray-500 text-[11px]'>(if Applicable)</span>:</div>
                                <input
                                  {...register('rating')}
                                  type="text"
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Date of Examination / Conferment:</div>
                                <input
                                  {...register('exam_date', { required: true })}
                                  type="date"
                                  className='app__input_standard'/>
                                {errors.exam_date && <div className='app__error_message'>Date of Examination is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Place of Examination / Conferment:</div>
                                <input
                                  {...register('exam_place', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.exam_place && <div className='app__error_message'>Place of Examination is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>License No. <span className='text-gray-500 text-[11px]'>(if Applicable)</span>:</div>
                                <input
                                  {...register('license_number')}
                                  type="text"
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Date of Validity <span className='text-gray-500 text-[11px]'>(if Applicable)</span>:</div>
                                <input
                                  {...register('license_validity')}
                                  type="date"
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full space-x-2'>
                                <CustomButton
                                  containerStyles='app__btn_green'
                                  title='Add'
                                  btnType='submit'
                                  />
                                <CustomButton
                                  containerStyles='app__btn_gray'
                                  title='Cancel'
                                  btnType='button'
                                  handleClick={() => setShowAddRow(false)}
                                  />
                              </div>
                            </div>
                      }
                    </form>
                  </div>
                  <hr className='my-6 mx-4'/>
                  <form onSubmit={handleSubmit2(onSubmit)} className="w-full">
                  <div className='w-full px-4'>
                    <div className='app__label_standard'>
                      <label className='flex items-center space-x-1'>
                        <input
                          {...register2('confirmed', { required: true })}
                          type='checkbox'
                          className=''/>
                        <span className='font-normal text-xs'>By checking this box, you acknowledge that all information is accurate and up-to-date.</span>
                      </label>
                      {errors2.confirmed && <div className='app__error_message'>Confirmation is required</div>}
                    </div>
                  </div>
                  <div className="app__modal_footer_left mx-4 mt-4">
                        <button
                          type="submit"
                          className="app__btn_green_sm"
                        >
                          {saving ? 'Saving..' : 'Save Changes'}
                        </button>
                  </div>
                  </form>
                </>
            }
          </div>
      }
    </div>
  )
}
