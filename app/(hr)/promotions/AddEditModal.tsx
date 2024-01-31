import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { CustomButton, SearchUserInput, UserBlock } from '@/components'

// Types
import type { PromotionTypes, namesType, ItemTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

interface ModalProps {
  hideModal: () => void
  editData: PromotionTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [user, setUser] = useState<namesType | null>(null)

  const [selectedItem, setSelectedItem] = useState('')

  const [plantillaItems, setPlantillaItems] = useState<ItemTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<PromotionTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PromotionTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: PromotionTypes) => {
    if (!user) return

    if (saving) return

    const newData = {
      user_id: user.id,
      item_id: formdata.item_id,
      effectivity_date: formdata.effectivity_date,
      status: 'For Verification',
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    try {
      const { data, error } = await supabase
        .from('hrm_promotions')
        .insert(newData)
        .select()

      if (error) {
        void logError('Create New Promotion', 'hrm_promotions', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // insert to notifications
      const { error2 } = await supabase
        .from('hrm_notifications')
        .insert({
          message: 'You are added to a <b>Promotion</b>, please upload supporting documents.',
          url: '/mypromotions',
          type: 'promotion',
          user_id: user.id,
          promotion_id: data[0].id,
          reference_table: 'hrm_promotions'
        })

      if (error2) {
        throw new Error(error2.message)
      }

      // Append new data in redux
      const hrmItem = plantillaItems.find(p => p.id.toString() === formdata.item_id)
      const updatedData = { ...newData, hrm_item: hrmItem, hrm_user: user ?? null, id: data[0].id }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: Number(resultsCounter.showing) + 1, results: Number(resultsCounter.results) + 1 }))

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: PromotionTypes) => {
    if (!editData) return

    if (saving) return

    const newData = {
      item_id: formdata.item_id,
      effectivity_date: formdata.effectivity_date
    }

    try {
      const { error } = await supabase
        .from('hrm_promotions')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError('Update promotion', 'hrm_promotions', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // Update data in redux
      const hrmItems = plantillaItems.find(p => p.id.toString() === formdata.item_id)
      const items = [...globallist]
      const updatedData = { ...newData, hrm_item: hrmItems, id: editData.id }
      console.log('updatedData', updatedData)
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectedUsers = (selectedUsers: namesType[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
    } else {
      setUser(null)
    }
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    // display the default values of dynamic dropdowns
    if (editData) {
      setSelectedItem(editData.item_id ?? '')
    }

    reset({
      item_id: editData ? editData.item_id : '',
      effectivity_date: editData ? editData.effectivity_date : ''
    })

    const fetchPositionsData = async () => {
      const { data } = await supabase
        .from('hrm_items')
        .select('*, hrm_position:position_id(name)')
        .is('user_id', null)
        .eq('org_id', process.env.NEXT_PUBLIC_ORG_ID)

      setPlantillaItems(data ?? [])
    }

    void fetchPositionsData()
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Promotion Details
            </h5>
            <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                isDisabled={saving}
                btnType='button'
                handleClick={hideModal}
              />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Employee:</div>
                {
                  editData?.hrm_user
                    ? <UserBlock user={editData.hrm_user}/>
                    : <SearchUserInput
                        isMultiple={false}
                        handleSelectedUsers={handleSelectedUsers}/>
                }
                {!user && !editData && <div className='app__error_message'>Employee name is required</div>}
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Vacant Item/Position <span className='text-xs italic font-normal'>(Refer on Plantilla Items records)</span></div>
                <div>
                  <select
                    {...register('item_id', { required: true })}
                    value={selectedItem}
                    onChange={e => setSelectedItem(e.target.value)}
                    className='app__input_standard'>
                      <option value=''>Choose Position</option>
                      {
                        plantillaItems.map((item: ItemTypes, index) => <option key={index} value={item.id}>{item.hrm_position.name}</option>)
                      }
                  </select>
                  {errors.item_id && <div className='app__error_message'>Position is required</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Effectivity Date</div>
                <div>
                  <input
                    {...register('effectivity_date', { required: true })}
                    type='date'
                    className='app__input_standard'/>
                  {errors.effectivity_date && <div className='app__error_message'>Effectivity Date is required</div>}
                </div>
              </div>
            </div>
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
                    isDisabled={saving}
                    title={saving ? 'Saving...' : 'Save'}
                    containerStyles="app__btn_green"
                  />
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
  )
}

export default AddEditModal
