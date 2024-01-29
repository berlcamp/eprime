import React, { useState } from 'react'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'
import { capitalizeWords } from '@/utils/text-helper'

// Types
import type { AssignmentTypes } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'

interface ModalProps {
  hideModal: () => void
  editData: AssignmentTypes | null
}

const RevokeModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [errorAgree, setErrorAgree] = useState('')
  const [isAgreeChecked, setIsAgreeChecked] = useState(false)
  const [endDate, setEndDate] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleRevoke = async () => {
    if (!editData) return

    if (endDate === '') {
      setErrorMessage('End date is required')
      return
    } else {
      setErrorMessage('')
    }

    if (!isAgreeChecked) {
      setErrorAgree('Checking this is required')
      return
    } else {
      setErrorAgree('')
    }

    const newData = {
      to: new Date(endDate), // use the string data before storing the redux to avoid error
      status: 'Revoked'
    }

    try {
      const { error } = await supabase
        .from('hrm_assignments')
        .update(newData)
        .eq('id', editData.id)

      if (error) throw new Error(error.message)

      const { error: error2 } = await supabase
        .from('hrm_service_records')
        .update({ to: endDate })
        .eq('assignment_id', editData.id)

      if (error2) throw new Error(error2.message)

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, to: endDate, id: editData.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully revoked.')

      setSaving(false)

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  if (!editData) return

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Revoke Assignment
            </h5>
            <CustomButton
                containerStyles='app__btn_gray'
                title='Close'
                isDisabled={saving}
                btnType='button'
                handleClick={hideModal}
              />
          </div>

          <div className="app__modal_body">
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>Employee Name:</div>
                <div className='app__label_value'>{capitalizeWords(editData.hrm_users?.firstname + ' ' + editData.hrm_users?.middlename + ' ' + editData.hrm_users?.lastname)}</div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>End Date</div>
                <div>
                  <input
                    onChange={e => setEndDate(e.target.value)}
                    type='date'
                    className='app__select_standard'/>
                    {errorMessage && <div className='text-xs text-red-500 mt-2 flex space-x-2'>{errorMessage}</div>}
                </div>
              </div>
            </div>
            <div className='app__form_field_container'>
              <div className='w-full'>
                <div className='app__label_standard'>
                  <label className='flex items-center space-x-2'>
                    <input
                      onChange={() => setIsAgreeChecked(!isAgreeChecked)}
                      checked={isAgreeChecked}
                      type='checkbox'
                      className=''/>
                    <span className='font-normal text-xs'>By checking this, you agree that the details are correct. After revoking, this assignment can no longer be edited.</span>
                  </label>
                  {errorAgree && <div className='text-xs text-red-500 mt-2 flex space-x-2'>{errorAgree}</div>}
                </div>
              </div>
            </div>
            <div className="app__modal_footer">
                  <CustomButton
                    btnType='submit'
                    handleClick={handleRevoke}
                    isDisabled={saving}
                    title={saving ? 'Saving...' : 'Revoke'}
                    containerStyles="app__btn_green"
                  />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  )
}

export default RevokeModal
