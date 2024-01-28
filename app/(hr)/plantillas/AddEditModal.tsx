import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { fetchPositions, fetchSchools, logError } from '@/utils/fetchApi'
import { CustomButton, SearchUserInput, UserBlock } from '@/components'

// Types
import type { PlantillaTypes, PositionTypes, SchoolTypes, namesType } from '@/types'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

interface ModalProps {
  hideModal: () => void
  editData: PlantillaTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [user, setUser] = useState<namesType | null>(null)

  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [positions, setPositions] = useState<PositionTypes[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const { register, formState: { errors }, reset, handleSubmit } = useForm<PlantillaTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PlantillaTypes) => {
    if (!user) return

    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: PlantillaTypes) => {
    if (!user) return

    const newData = {
      user_id: user.id,
      position_id: formdata.position_id,
      item_number: formdata.item_number,
      school_id: formdata.school_id ? formdata.school_id : null,
      salary_grade: formdata.salary_grade,
      vice: formdata.vice,
      sex: formdata.sex,
      birthday: formdata.birthday,
      eligibility: formdata.eligibility,
      date_of_last_promotion: formdata.date_of_last_promotion,
      date_of_original_appointment: formdata.date_of_original_appointment,
      status: formdata.status,
      authorized_annual_salary: formdata.authorized_annual_salary,
      actual_annual_salary: formdata.actual_annual_salary,
      area_code: formdata.area_code,
      area_type: formdata.area_type,
      level: formdata.level,
      tin_no: formdata.tin_no,
      umid_no: formdata.umid_no,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    try {
      const { data, error } = await supabase
        .from('hrm_plantillas')
        .insert(newData)
        .select()

      if (error) {
        void logError('Create New Plantilla', 'hrm_plantillas', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // Append new data in redux
      const hrmPosition = positions.find(p => p.id.toString() === formdata.position_id)
      const updatedData = { ...newData, hrm_position: hrmPosition, hrm_user: user ?? null, id: data[0].id }
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

  const handleUpdate = async (formdata: PlantillaTypes) => {
    if (!editData) return

    const newData = {
      position_id: formdata.position_id,
      item_number: formdata.item_number,
      school_id: formdata.school_id ? formdata.school_id : null,
      salary_grade: formdata.salary_grade,
      vice: formdata.vice,
      sex: formdata.sex,
      birthday: formdata.birthday,
      eligibility: formdata.eligibility,
      date_of_last_promotion: formdata.date_of_last_promotion,
      date_of_original_appointment: formdata.date_of_original_appointment,
      status: formdata.status,
      authorized_annual_salary: formdata.authorized_annual_salary,
      actual_annual_salary: formdata.actual_annual_salary,
      area_code: formdata.area_code,
      area_type: formdata.area_type,
      level: formdata.level,
      tin_no: formdata.tin_no,
      umid_no: formdata.umid_no
    }

    try {
      const { error } = await supabase
        .from('hrm_plantillas')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError('Update Plantilla', 'hrm_plantillas', JSON.stringify(newData), error.message)
        setToast('error', 'Saving failed, please reload the page and try again.')
        throw new Error(error.message)
      }

      // Update data in redux
      const hrmPosition = positions.find(p => p.id.toString() === formdata.position_id)
      const items = [...globallist]
      const updatedData = { ...newData, hrm_position: hrmPosition, id: editData.id }
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
      setSelectedSchool(editData.school_id ?? '')
      setSelectedPosition(editData.position_id ?? '')
    }

    reset({
      school_id: editData ? editData.school_id : '',
      position_id: editData ? editData.position_id : '',
      item_number: editData ? editData.item_number : '',
      salary_grade: editData ? editData.salary_grade : '',
      vice: editData ? editData.vice : '',
      sex: editData ? editData.sex : '',
      birthday: editData ? editData.birthday : '',
      eligibility: editData ? editData.eligibility : '',
      date_of_last_promotion: editData ? editData.date_of_last_promotion : '',
      date_of_original_appointment: editData ? editData.date_of_original_appointment : '',
      status: editData ? editData.status : '',
      authorized_annual_salary: editData ? editData.authorized_annual_salary : '',
      actual_annual_salary: editData ? editData.actual_annual_salary : '',
      area_code: editData ? editData.area_code : '',
      area_type: editData ? editData.area_type : '',
      level: editData ? editData.level : '',
      tin_no: editData ? editData.tin_no : '',
      umid_no: editData ? editData.umid_no : ''
    })

    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 500, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }

    const fetchSchoolsData = async () => {
      const result = await fetchSchools({}, 500, 0)
      setSchools(result.data.length > 0 ? result.data : [])
    }

    void fetchPositionsData()
    void fetchSchoolsData()
  }, [editData, reset])

  return (
  <>
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">
              Plantilla Details
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
            <div className='flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400'>
              {/* Begin First Column */}
              <div className='w-full px-4'>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Employee Name:</div>
                    {
                      editData?.hrm_user
                        ? <UserBlock user={editData.hrm_user}/>
                        : <SearchUserInput
                            isMultiple={false}
                            handleSelectedUsers={handleSelectedUsers}/>
                    }
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Item Number:</div>
                    <div>
                      <input
                        {...register('item_number', { required: true })}
                        type="text"
                        className='app__input_standard'/>
                      {errors.item_number && <div className='app__error_message'>Item Number is required</div>}
                    </div>
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Implementing Unit:</div>
                    <div>
                      <select
                        {...register('school_id', { required: true })}
                        value={selectedSchool}
                        onChange={e => setSelectedSchool(e.target.value)}
                        className='app__input_standard'>
                          <option value=''>Division</option>
                          {
                            schools.map((school: SchoolTypes, index) => <option key={index} value={school.id}>{school.name}</option>)
                          }
                      </select>
                      {errors.school_id && <div className='app__error_message'>Current School is required</div>}
                    </div>
                  </div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Birthday:</div>
                    <div>
                      <input
                        {...register('birthday')}
                        type="date"
                        className='app__input_standard'/>
                    </div>
                  </div>
                </div>
              </div>
              {/* End First Column */}
              {/* Begin Second Column */}
              <div className='w-full px-4'>
                <div className="flex items-center">
                  <div className="flex-grow bg-gray-300 h-px"></div>
                  <div className="mx-4 my-4 text-gray-500 text-sm">Position Settings</div>
                  <div className="flex-grow bg-gray-300 h-px"></div>
                </div>
                <div className='app__form_field_container'>
                  <div className='w-full'>
                    <div className='app__label_standard'>Current Position:</div>
                    <div>
                      <select
                        {...register('position_id', { required: true })}
                        value={selectedPosition}
                        onChange={e => setSelectedPosition(e.target.value)}
                        className='app__input_standard'>
                          <option value=''>Choose Position</option>
                          {
                            positions.map((position: PositionTypes, index) => <option key={index} value={position.id}>{position.name}</option>)
                          }
                      </select>
                      {errors.position_id && <div className='app__error_message'>Current Position is required</div>}
                    </div>
                  </div>
                </div>
              </div>
              {/* End Second Column */}
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
            <div className="app__modal_footer">
                  <button
                    type="submit"
                    className="app__btn_green_sm"
                  >
                    {saving ? 'Saving..' : 'Save'}
                  </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
  )
}

export default AddEditModal
