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
  name: string
  address: string
  telephone: string
}

interface ReferencesTypes {
  references: string
  confirmed: string
}

export default function References ({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [referencesArray, setReferencesArray] = useState<FormRowTypes[] | []>([])
  const [showAddRow, setShowAddRow] = useState(false)

  const { register, formState: { errors }, reset, handleSubmit } = useForm<FormRowTypes>({
    mode: 'onSubmit'
  })

  const { register: register2, formState: { errors: errors2 }, handleSubmit: handleSubmit2 } = useForm<ReferencesTypes>({
    mode: 'onSubmit'
  })

  const onSubmitRow = async (formdata: FormRowTypes) => {
    setReferencesArray([{
      nanoid: nanoid(),
      name: formdata.name,
      address: formdata.address,
      telephone: formdata.telephone
    }, ...referencesArray])

    reset()
    setShowAddRow(false)
  }

  const onSubmit = async (formdata: ReferencesTypes) => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      references: referencesArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError('Update Voluntary Work Experience PDS', 'hrm_pds', JSON.stringify(newData), error.message)
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
      if (data.references) {
        setReferencesArray(data.references)
      }
    }

    if (error) console.log(error.message)

    setLoading(false)
  }

  const HandleRemoveItem = (item: FormRowTypes) => {
    const updatedData = referencesArray.filter(e => (e.nanoid !== item.nanoid))
    setReferencesArray(updatedData)
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
                <div className="mx-4 my-4 text-gray-500 text-sm">References</div>
                <div className="flex-grow bg-gray-300 h-px"></div>
              </div>
              <div className='w-full'>
                {
                  referencesArray.length > 0 &&
                    <table className='app__table mb-4'>
                      <thead className='app__thead'>
                        <tr>
                          <th className='app__th'>Name</th>
                          <th className='app__th'>Address</th>
                          <th className='app__th'>Telephone</th>
                          <th className='app__th'></th>
                        </tr>
                      </thead>
                      <tbody>
                      {
                        referencesArray.map((item, index) => (
                          <tr key={index} className='app__tr'>

                            <td className='app__td'>{item.name}</td>
                            <td className='app__td'>{item.address}</td>
                            <td className='app__td'>{item.telephone}</td>
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
                              title='Add Reference'
                              btnType='button'
                              handleClick={() => setShowAddRow(true)}
                              />
                          : <div className='w-2/3 space-y-4'>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Name <span className='text-red-500 text-[11px]'>(Person not related by consanguinity or affinity to applicant /appointee)</span>:</div>
                                <input
                                  {...register('name', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.name && <div className='app__error_message'>Name is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Address:</div>
                                <input
                                  {...register('address', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.address && <div className='app__error_message'>Address is required</div>}
                              </div>
                              <div className='mb-2 w-full'>
                                <div className='app__label_standard'>Telephone:</div>
                                <input
                                  {...register('telephone', { required: true })}
                                  type="text"
                                  className='app__input_standard'/>
                                {errors.telephone && <div className='app__error_message'>Telephone is required</div>}
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
