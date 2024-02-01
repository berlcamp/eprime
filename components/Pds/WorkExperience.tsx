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
  from: string
  to: string
  position_title: string
  company: string
  monthly_salary: string
  salary_grade: string
  status: string
  government_service: string
}

interface WorkExperienceTypes {
  work_experience: string
  confirmed: string
}

export default function WorkExperience ({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [workExperienceArray, setWorkExperienceArray] = useState<FormRowTypes[] | []>([])
  const [showAddRow, setShowAddRow] = useState(false)

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormRowTypes>({
    mode: 'onSubmit'
  })

  const { register: register2, formState: { errors: errors2 }, handleSubmit: handleSubmit2 } = useForm<WorkExperienceTypes>({
    mode: 'onSubmit'
  })

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setWorkExperienceArray([{
      nanoid: nanoid(),
      from: formdata.from,
      to: formdata.to,
      position_title: formdata.position_title,
      company: formdata.company,
      monthly_salary: formdata.monthly_salary,
      salary_grade: formdata.salary_grade,
      status: formdata.status,
      government_service: formdata.government_service
    }, ...workExperienceArray])

    reset()
    setShowAddRow(false)
  }

  const onSubmit = async (formdata: WorkExperienceTypes) => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      work_experience: workExperienceArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError('Update Work Experience PDS', 'hrm_pds', JSON.stringify(newData), error.message)
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
      if (data.work_experience) {
        setWorkExperienceArray(data.work_experience)
      }
    }

    if (error) console.log(error.message)

    setLoading(false)
  }

  const HandleRemoveItem = (item: FormRowTypes) => {
    const updatedData = workExperienceArray.filter(e => (e.nanoid !== item.nanoid))
    setWorkExperienceArray(updatedData)
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
            <hr className='my-6 mx-4'/>
            <div className='w-full px-4'>
              <div className="flex items-center">
                <div className="flex-grow bg-gray-300 h-px"></div>
                <div className="mx-4 my-4 text-gray-500 text-sm">Work Experience</div>
                <div className="flex-grow bg-gray-300 h-px"></div>
              </div>
              <div className='w-full'>
                {
                  workExperienceArray.length > 0 &&
                    <table className='app__table mb-4'>
                      <thead className='app__thead'>
                        <tr>
                          <th className='app__th'>Inclusive Dates</th>
                          <th className='app__th'>Position</th>
                          <th className='app__th'>Department/Agency/Office/Company</th>
                          <th className='app__th'>Montly Salary</th>
                          <th className='app__th'>Salary/Job/Pay Grade & Step Increment</th>
                          <th className='app__th'>Status of Appointment</th>
                          <th className='app__th'>Govt Service</th>
                          <th className='app__th'></th>
                        </tr>
                      </thead>
                      <tbody>
                      {
                        workExperienceArray.map((item, index) => (
                          <tr key={index} className='app__tr'>

                            <td className='app__td'>{item.from} - {item.to}</td>
                            <td className='app__td'>{item.position_title}</td>
                            <td className='app__td'>{item.company}</td>
                            <td className='app__td'>{item.monthly_salary}</td>
                            <td className='app__td'>{item.salary_grade}</td>
                            <td className='app__td'>{item.status}</td>
                            <td className='app__td'>{item.government_service}</td>
                            <td className='app__td'>
                              <CustomButton
                                containerStyles='app__btn_red'
                                title='Remove'
                                btnType='button'
                                handleClick={() => HandleRemoveItem(item)}
                                />
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
                  <div className='w-full px-4'>
                    <form onSubmit={handleSubmit(onSubmitRow)} className="text-xs">
                      {
                        !showAddRow
                          ? <CustomButton
                              containerStyles='app__btn_blue'
                              title='Add Work Experience'
                              btnType='button'
                              handleClick={() => setShowAddRow(true)}
                              />
                          : <div className='w-2/3 space-y-4'>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Inclusive Dates (From):</div>
                                <input
                                  {...register('from', { required: true })}
                                  type="date"
                                  className='app__input_standard'/>
                                {errors.from && <div className='app__error_message'>Date is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Inclusive Dates (To):</div>
                                <input
                                  {...register('to', { required: true })}
                                  type="date"
                                  className='app__input_standard'/>
                                {errors.to && <div className='app__error_message'>Date is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Position Title <span className='text-gray-500 text-[11px]'>(Write in full/Do not abbreviate)</span>:</div>
                                <input
                                  {...register('position_title', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.position_title && <div className='app__error_message'>Position Title is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Department/Agency/Office/Company <span className='text-gray-500 text-[11px]'>(Write in full/Do not abbreviate)</span>:</div>
                                <input
                                  {...register('company', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.company && <div className='app__error_message'>Department/Agency/Office/Company is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Monthly Salary:</div>
                                <input
                                  {...register('monthly_salary', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.monthly_salary && <div className='app__error_message'>Monthly Salary is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Salary Job/Pay Grade <span className='text-gray-500 text-[11px]'>(if applicable)</span> & Step <span className='text-gray-500 text-[11px]'>(Format &quot;00-0&quot;) INCREMENT</span>:</div>
                                <input
                                  {...register('salary_grade')}
                                  type="text"
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Status of Appointment:</div>
                                <input
                                  {...register('status')}
                                  type="text"
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Gov&apos;t Service (Y/N):</div>
                                <input
                                  {...register('government_service')}
                                  type="text"
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
