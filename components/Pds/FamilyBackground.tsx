import React, { useEffect, useState } from 'react'
import TwoColTableLoading from '../Loading/TwoColTableLoading'
import { useSupabase } from '@/context/SupabaseProvider'
import { useForm } from 'react-hook-form'
import type { PdsFamilyBackgroundTypes } from '@/types'
import { logError } from '@/utils/fetchApi'
import { useFilter } from '@/context/FilterContext'
import CustomButton from '../CustomButton'
import { format } from 'date-fns'

interface childrenArrayTypes {
  child_name: string
  child_birthday: string
}

export default function FamilyBackground ({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [childrenArray, setChildrenArray] = useState<childrenArrayTypes[] | []>([])
  const [showAddChildForm, setShowAddChildForm] = useState(false)
  const [childName, setChildName] = useState('')
  const [childBirthday, setChildBirthday] = useState('')

  const [userData, setUserData] = useState<PdsFamilyBackgroundTypes | null>(null)

  const { register, formState: { errors }, reset, handleSubmit } = useForm<PdsFamilyBackgroundTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PdsFamilyBackgroundTypes) => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      spouse_firstname: formdata.spouse_firstname,
      spouse_middlename: formdata.spouse_middlename,
      spouse_lastname: formdata.spouse_lastname,
      spouse_ext: formdata.spouse_ext,
      spouse_occupation: formdata.spouse_occupation,
      spouse_employer: formdata.spouse_employer,
      spouse_business_address: formdata.spouse_business_address,
      spouse_business_telephone: formdata.spouse_business_telephone,
      father_firstname: formdata.father_firstname,
      father_middlename: formdata.father_middlename,
      father_lastname: formdata.father_lastname,
      father_ext: formdata.father_ext,
      mother_firstname: formdata.mother_firstname,
      mother_middlename: formdata.mother_middlename,
      mother_lastname: formdata.mother_lastname,
      children: childrenArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError('Update Pds Family Background', 'hrm_pds', JSON.stringify(newData), error.message)
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
      setUserData(data)

      // transfer the children json to state
      if (data.children) {
        setChildrenArray(data.children)
      }
    }

    if (error) console.log(error.message)

    reset({
      spouse_firstname: data ? data.spouse_firstname : '',
      spouse_middlename: data ? data.spouse_middlename : '',
      spouse_lastname: data ? data.spouse_lastname : '',
      spouse_ext: data ? data.spouse_ext : '',
      spouse_occupation: data ? data.spouse_occupation : '',
      spouse_employer: data ? data.spouse_employer : '',
      spouse_business_address: data ? data.spouse_business_address : '',
      spouse_business_telephone: data ? data.spouse_business_telephone : '',
      father_firstname: data ? data.father_firstname : '',
      father_middlename: data ? data.father_middlename : '',
      father_lastname: data ? data.father_lastname : '',
      father_ext: data ? data.father_ext : '',
      mother_firstname: data ? data.mother_firstname : '',
      mother_middlename: data ? data.mother_middlename : '',
      mother_lastname: data ? data.mother_lastname : ''
    })

    setLoading(false)
  }

  const handleAddChild = () => {
    if (childName.trim() === '' || childBirthday.trim() === '') return

    setChildrenArray([{ child_name: childName, child_birthday: childBirthday }, ...childrenArray])

    setChildName('')
    setChildBirthday('')
    setShowAddChildForm(false)
  }

  const HandleRemoveChild = (child: childrenArrayTypes) => {
    const updatedChildren = childrenArray.filter(item => child.child_name !== item.child_name)
    setChildrenArray(updatedChildren)
  }

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <div className='w-full'>
      { loading && <TwoColTableLoading/> }
      {
        !loading &&
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <div className='flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400'>
              {/* Begin First Column */}
              <div className='w-full px-4'>
                <div className="flex items-center">
                  <div className="flex-grow bg-gray-300 h-px"></div>
                  <div className="mx-4 my-4 text-gray-500 text-sm">Spouse Information</div>
                  <div className="flex-grow bg-gray-300 h-px"></div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Spouse First Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_firstname}</div>
                        : <div>
                            <input
                              {...register('spouse_firstname')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Spouse Middle Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_middlename}</div>
                        : <div>
                            <input
                              {...register('spouse_middlename')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Spouse Last Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_lastname}</div>
                        : <div>
                            <input
                              {...register('spouse_lastname')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Spouse Name Ext:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_ext}</div>
                        : <div>
                            <input
                              {...register('spouse_ext')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Spouse Occupation:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_occupation}</div>
                        : <div>
                            <input
                              {...register('spouse_occupation')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Spouse Employeer/Business Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_employer}</div>
                        : <div>
                            <input
                              {...register('spouse_employer')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Business Address:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_business_address}</div>
                        : <div>
                            <input
                              {...register('spouse_business_address')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Telephone No:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.spouse_business_telephone}</div>
                        : <div>
                            <input
                              {...register('spouse_business_telephone')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
              </div>
              {/* End First Column */}
              {/* Begin Second Column */}
              <div className='w-full px-4'>
                <div className="flex items-center">
                  <div className="flex-grow bg-gray-300 h-px"></div>
                  <div className="mx-4 my-4 text-gray-500 text-sm">Father Information</div>
                  <div className="flex-grow bg-gray-300 h-px"></div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Father First Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.father_firstname}</div>
                        : <div>
                            <input
                              {...register('father_firstname')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Father Middle Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.father_middlename}</div>
                        : <div>
                            <input
                              {...register('father_middlename')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Father Last Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.father_lastname}</div>
                        : <div>
                            <input
                              {...register('father_lastname')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Father Name Ext:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.father_ext}</div>
                        : <div>
                            <input
                              {...register('father_ext')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-grow bg-gray-300 h-px"></div>
                  <div className="mx-4 my-4 text-gray-500 text-sm">Mother Information</div>
                  <div className="flex-grow bg-gray-300 h-px"></div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Mother First Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.mother_firstname}</div>
                        : <div>
                            <input
                              {...register('mother_firstname')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Mother Middle Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.mother_middlename}</div>
                        : <div>
                            <input
                              {...register('mother_middlename')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Mother Last Name:</div>
                    {
                      userId !== session.user.id
                        ? <div className='app__label_value'>{userData?.mother_lastname}</div>
                        : <div>
                            <input
                              {...register('mother_lastname')}
                              type="text"
                              className='app__input_standard'/>
                          </div>
                    }
                  </div>
                </div>
              </div>
              {/* End Second Column */}
            </div>
            <hr className='my-6 mx-4'/>
            <div className='w-full px-4'>
              <div className="flex items-center">
                <div className="flex-grow bg-gray-300 h-px"></div>
                <div className="mx-4 my-4 text-gray-500 text-sm">Children</div>
                <div className="flex-grow bg-gray-300 h-px"></div>
              </div>
              <div className='w-full'>
                {
                  childrenArray.length > 0 &&
                    <table className='app__table mb-4'>
                      <thead className='app__thead'>
                        <tr>
                          <th className='app__th'>Child Name</th>
                          <th className='app__th'>Date of Birth</th>
                          <th className='app__th'></th>
                        </tr>
                      </thead>
                      <tbody>
                      {
                        childrenArray.map((child, index) => (
                          <tr key={index} className='app__tr'>
                            <td className='app__td'>{child.child_name}</td>
                            <td className='app__td'>{format(new Date(child.child_birthday), 'MMMM dd, yyyy')}</td>
                            <td className='app__td'>
                              {
                                userId === session.user.id &&
                                  <CustomButton
                                    containerStyles='app__btn_red'
                                    title='Remove'
                                    btnType='button'
                                    handleClick={() => HandleRemoveChild(child)}
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
                    <div>
                      {
                        !showAddChildForm
                          ? <CustomButton
                              containerStyles='app__btn_blue'
                              title='Add Child'
                              btnType='button'
                              handleClick={() => setShowAddChildForm(true)}
                              />
                          : <div className='w-2/3 space-y-4'>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Child Fullname:</div>
                                <input
                                  type='text'
                                  value={childName}
                                  onChange={e => setChildName(e.target.value)}
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Date of Birth:</div>
                                <input
                                  type='date'
                                  value={childBirthday}
                                  onChange={e => setChildBirthday(e.target.value)}
                                  className='app__input_standard'/>
                              </div>
                              <div className='mb-2 w-full space-x-2'>
                                <CustomButton
                                  containerStyles='app__btn_green'
                                  title='Add'
                                  btnType='button'
                                  handleClick={handleAddChild}
                                  />
                                <CustomButton
                                  containerStyles='app__btn_gray'
                                  title='Cancel'
                                  btnType='button'
                                  handleClick={() => setShowAddChildForm(false)}
                                  />
                              </div>
                            </div>
                      }
                    </div>
                  </div>
                  <hr className='my-6 mx-4'/>
                  <div className='w-full px-4'>
                    <div className='app__label_standard'>
                      <label className='flex items-center space-x-1'>
                        <input
                          {...register('confirmed', { required: true })}
                          type='checkbox'
                          className=''/>
                        <span className='font-normal text-xs'>By checking this box, you acknowledge that all information is accurate and up-to-date.</span>
                      </label>
                      {errors.confirmed && <div className='app__error_message'>Confirmation is required</div>}
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
                </>
            }
          </form>
      }
    </div>
  )
}
