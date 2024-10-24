import {
  ConfirmModal,
  CustomButton,
  SearchUserInput,
  UserBlock
} from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  fetchImplementingUnits,
  fetchPositions,
  fetchSchools,
  logError
} from '@/utils/fetchApi'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type {
  Employee,
  ImplementingUnitTypes,
  ItemTypes,
  PositionTypes,
  SchoolTypes,
  namesType
} from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { format } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: ItemTypes | null
}

const PlantillaDetails = ({ hideModal, editData }: ModalProps) => {
  const { setToast, hasAccess } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [reason, setReason] = useState('')
  const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false)

  const [user, setUser] = useState<namesType | null>(
    editData ? editData.hrm_user : null
  )

  const [selectedImplementingUnit, setSelectedImplementingUnit] = useState(
    editData ? editData.implementing_unit_id : ''
  )
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')

  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [positions, setPositions] = useState<PositionTypes[] | []>([])
  const [implementingUnits, setImplementingUnits] = useState<
    ImplementingUnitTypes[] | []
  >([])

  // Check access from employee_accounts settings or Super Admins
  const isHr = hasAccess('records')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    setValue,
    handleSubmit
  } = useForm<ItemTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: ItemTypes) => {
    if (saving) return

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: ItemTypes) => {
    // if selected item holder already has an item
    if (user) {
      const userExists = await checkExistingHolder(user.id)
      if (userExists) {
        setToast('error', 'This employee already has an existing item.')
        return
      }
    }

    setSaving(true)

    const newData = {
      user_id: user ? user.id : null,
      position_id: formdata.position_id,
      item_number: formdata.item_number,
      implementing_unit_id: formdata.implementing_unit_id,
      school_id: formdata.school_id ? formdata.school_id : null,
      salary_grade: formdata.salary_grade,
      vice: formdata.vice,
      sex: formdata.sex,
      birthday: format(new Date(formdata.birthday), 'MM/dd/yyyy'),
      eligibility: formdata.eligibility,
      date_of_last_promotion: new Date(formdata.date_of_last_promotion),
      date_of_original_appointment: new Date(
        formdata.date_of_original_appointment
      ),
      status: formdata.status,
      authorized_annual_salary: formdata.authorized_annual_salary,
      actual_annual_salary: formdata.actual_annual_salary,
      area_code: formdata.area_code,
      area_type: formdata.area_type,
      level: formdata.level,
      tin_no: formdata.tin_no,
      umid_no: formdata.umid_no,
      updated_by: session.user.id,
      org_id: process.env.NEXT_PUBLIC_ORG_ID
    }

    try {
      const { data, error } = await supabase
        .from('hrm_items')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create New Plantilla',
          'hrm_items',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      if (user) {
        const { error2 } = await supabase
          .from('hrm_users')
          .update({
            item_id: data[0].id,
            joining_date: formdata.date_of_original_appointment,
            date_of_last_promotion: formdata.date_of_last_promotion
          })
          .eq('id', user.id)

        if (error2) {
          void logError(
            'Update user item id',
            'hrm_users',
            JSON.stringify(newData),
            error2.message
          )
          setToast(
            'error',
            'Saving failed, please reload the page and try again.'
          )
          throw new Error(error2.message)
        }
      }

      // Append new data in redux
      const hrmPosition = positions.find(
        (p) => p.id.toString() === formdata.position_id
      )
      const hrmImplementingUnit = implementingUnits.find(
        (p) => p.id.toString() === formdata.implementing_unit_id
      )

      const updatedData = {
        ...newData,
        implementing_unit: hrmImplementingUnit,
        hrm_position: hrmPosition,
        hrm_user: user ?? null,
        id: data[0].id
      }
      dispatch(updateList([updatedData, ...globallist]))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      setSaving(false)

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async (formdata: ItemTypes) => {
    if (!editData) return

    setSaving(true)

    const newData = {
      position_id: formdata.position_id,
      item_number: formdata.item_number,
      implementing_unit_id: formdata.implementing_unit_id,
      school_id: formdata.school_id !== '' ? formdata.school_id : null,
      salary_grade: formdata.salary_grade,
      vice: formdata.vice,
      sex: formdata.sex,
      birthday: format(new Date(formdata.birthday), 'MM/dd/yyyy'),
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
      updated_by: session.user.id
    }

    try {
      const { error } = await supabase
        .from('hrm_items')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update Plantilla',
          'hrm_items',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      if (user) {
        const { error2 } = await supabase
          .from('hrm_users')
          .update({
            item_id: editData.id,
            joining_date: formdata.date_of_original_appointment,
            date_of_last_promotion: formdata.date_of_last_promotion
          })
          .eq('id', user.id)

        if (error2) {
          void logError(
            'Update user item id',
            'hrm_users',
            JSON.stringify(newData),
            error2.message
          )
          setToast(
            'error',
            'Saving failed, please reload the page and try again.'
          )
          throw new Error(error2.message)
        }
      }

      // Update data in redux
      const hrmPosition = positions.find(
        (p) => p.id.toString() === formdata.position_id?.toString()
      )
      const hrmImplementingUnit = implementingUnits.find(
        (p) => p.id.toString() === formdata.implementing_unit_id?.toString()
      )
      const items = [...globallist]
      const updatedData = {
        ...newData,
        implementing_unit: hrmImplementingUnit,
        hrm_position: hrmPosition,
        hrm_user: user ?? null,
        id: editData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
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

  const checkExistingHolder = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('hrm_items')
      .select('user_id')
      .eq('user_id', userId)
      .single() // Use .single() to fetch one record, as user_id is likely unique

    if (error) {
      console.error('Error checking user:', error.message)
      return false
    }

    return data !== null
  }

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      const selectedUser = selectedUsers[0]
      if (selectedUser.school_id) {
        setValue('school_id', selectedUser.school_id)
      }
      if (selectedUser.birthday) {
        setValue(
          'birthday',
          format(new Date(selectedUser.birthday), 'yyyy-MM-dd')
        )
      }
      setValue('sex', selectedUser.gender)
      setUser(selectedUser)
    } else {
      setUser(null)
    }
  }

  const handleRemove = () => {
    setShowConfirmRemoveModal(true)
  }

  const handleConfirmedRemove = async () => {
    if (!editData) return

    if (!editData.hrm_user) return

    if (saving) return

    setSaving(true)

    const newData = {
      user_id: null,
      vacancy_type: 'Natural Vacancy',
      date_of_last_promotion: null,
      date_of_original_appointment: null,
      reason_for_removal: reason
    }

    try {
      const { error } = await supabase
        .from('hrm_items')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Remove employee to Plantilla',
          'hrm_items',
          '',
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // remove item_id from hrm_user
      const { error: error2 } = await supabase
        .from('hrm_users')
        .update({
          item_id: null
        })
        .eq('id', editData.hrm_user.id)

      if (error2) {
        void logError(
          'Remove item_id on hrm_users',
          'hrm_users',
          '',
          error2.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error2.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = { ...newData, hrm_user: null, id: editData.id }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
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

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    // display the default values of dynamic dropdowns
    if (editData) {
      setSelectedSchool(editData.school_id ?? '')
      setSelectedPosition(editData.position_id ?? '')
    }

    reset({
      implementing_unit_id: editData ? editData.implementing_unit_id : '',
      school_id: editData ? editData.school_id : '',
      position_id: editData ? editData.position_id : '',
      item_number: editData ? editData.item_number : '',
      salary_grade: editData ? editData.salary_grade : '',
      vice: editData ? editData.vice : '',
      sex: editData ? editData.sex : '',
      birthday: editData ? editData.birthday : '',
      eligibility: editData ? editData.eligibility : '',
      date_of_last_promotion: editData ? editData.date_of_last_promotion : '',
      date_of_original_appointment: editData
        ? editData.date_of_original_appointment
        : '',
      status: editData ? editData.status : '',
      authorized_annual_salary: editData
        ? editData.authorized_annual_salary
        : '',
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

    const fetchIus = async () => {
      const result = await fetchImplementingUnits('', 3000, 0)
      setImplementingUnits(result.data.length > 0 ? result.data : [])
    }
    void fetchIus()
    void fetchPositionsData()
    void fetchSchoolsData()
  }, [editData, reset])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Item Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>
            {editData?.hrm_user && isHr && (
              <div className="flex space-x-2 items-center justify-between border-b p-4 bg-orange-50">
                <div className="w-full">
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-gray-700">
                      Remove the current employee from this plantilla with the
                      following reason:
                    </div>
                    <div className="flex w-full space-x-2">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm outline-none resize-none w-1/2"
                        placeholder="Reason for removal"
                      />
                    </div>
                    <CustomButton
                      containerStyles="app__btn_green"
                      title={saving ? 'Saving...' : 'Submit'}
                      btnType="button"
                      handleClick={handleRemove}
                    />
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
                {/* Begin First Column */}
                <div className="w-full px-4">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Item Number</div>
                      {!isHr ? (
                        <div className="app__label_value">
                          {editData ? editData.item_number : ''}
                        </div>
                      ) : (
                        <div>
                          <input
                            {...register('item_number', { required: true })}
                            type="text"
                            placeholder="Item No."
                            className="app__input_standard"
                          />
                          {errors.item_number && (
                            <div className="app__error_message">
                              Item Number is required
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Position</div>
                      {!isHr ? (
                        <div className="app__label_value">
                          {
                            positions?.filter(
                              (p) => p.id === editData?.position_id
                            )[0]?.name
                          }
                        </div>
                      ) : (
                        <div>
                          <select
                            {...register('position_id', { required: true })}
                            value={selectedPosition}
                            onChange={(e) =>
                              setSelectedPosition(e.target.value)
                            }
                            className="app__select_standard"
                          >
                            <option value="">Choose Position</option>
                            {positions.map((position: PositionTypes, index) => (
                              <option key={index} value={position.id}>
                                {position.name}
                              </option>
                            ))}
                          </select>
                          {errors.position_id && (
                            <div className="app__error_message">
                              Position is required
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Item Holder:</div>
                      {editData?.hrm_user ? (
                        <UserBlock user={editData.hrm_user} />
                      ) : (
                        <>
                          <SearchUserInput
                            isMultiple={false}
                            handleSelectedUsers={handleSelectedUsers}
                          />
                          <div className="text-gray-600 italic mt-1">
                            (Leaving blank means this item is Vacant)
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">
                        Implementing Unit (IUs)
                      </div>
                      {!isHr ? (
                        <div className="app__label_value">
                          {
                            implementingUnits.filter(
                              (p) => p.id === editData?.implementing_unit_id
                            )[0]?.name
                          }
                        </div>
                      ) : (
                        <div>
                          <select
                            {...register('implementing_unit_id', {
                              required: true
                            })}
                            value={selectedImplementingUnit}
                            onChange={(e) =>
                              setSelectedImplementingUnit(e.target.value)
                            }
                            className="app__input_standard"
                          >
                            <option value="">Choose</option>
                            {implementingUnits.map((iu, index) => (
                              <option key={index} value={iu.id}>
                                {iu.name}
                              </option>
                            ))}
                          </select>
                          {errors.implementing_unit_id && (
                            <div className="app__error_message">
                              Implementing Unit (IUs) is required
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* End First Column */}
                {/* Begin Second Column */}
                <div className="w-full px-4">
                  {!user ? (
                    <div className="flex items-center">
                      <div className="flex-grow bg-gray-300 h-px"></div>
                      <div className="mx-4 my-4 text-gray-500 text-sm">
                        No item holder selected
                      </div>
                      <div className="flex-grow bg-gray-300 h-px"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <div className="flex-grow bg-gray-300 h-px"></div>
                        <div className="mx-4 my-4 text-gray-500 text-sm">
                          Employee Details
                        </div>
                        <div className="flex-grow bg-gray-300 h-px"></div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Assigned To</div>
                          <div>
                            <select
                              {...register('school_id')}
                              value={selectedSchool}
                              onChange={(e) =>
                                setSelectedSchool(e.target.value)
                              }
                              className="app__input_standard"
                            >
                              <option value="">Division</option>
                              {schools.map((school, index) => (
                                <option key={index} value={school.id}>
                                  {school.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Vice</div>
                          <div>
                            <input
                              {...register('vice')}
                              type="text"
                              placeholder="Vice"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Sex</div>
                          <div>
                            <select
                              {...register('sex')}
                              className="app__select_standard"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Date of Birthday
                          </div>
                          <div>
                            <input
                              {...register('birthday')}
                              type="date"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Civil Service Eligibility
                          </div>
                          <div>
                            <input
                              {...register('eligibility')}
                              type="text"
                              placeholder="Civil Service Eligibility"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Date of Promotion
                          </div>
                          <div>
                            <input
                              {...register('date_of_last_promotion', {
                                required: true
                              })}
                              type="date"
                              className="app__input_standard"
                            />
                            {errors.date_of_last_promotion && (
                              <div className="app__error_message">
                                Date of Promotion is required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Date of Original Appointment
                          </div>
                          <div>
                            <input
                              {...register('date_of_original_appointment', {
                                required: true
                              })}
                              type="date"
                              className="app__input_standard"
                            />
                            {errors.date_of_original_appointment && (
                              <div className="app__error_message">
                                Date of Original Appointment is required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Status</div>
                          <div>
                            <input
                              {...register('status')}
                              type="status"
                              placeholder="Status"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Authorized Annual Salary
                          </div>
                          <div>
                            <input
                              {...register('authorized_annual_salary')}
                              type="text"
                              placeholder="Authorized Annual Salary"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Actual Annual Salary
                          </div>
                          <div>
                            <input
                              {...register('actual_annual_salary')}
                              type="text"
                              placeholder="Actual Annual Salary"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Area Code</div>
                          <div>
                            <input
                              {...register('area_code')}
                              type="text"
                              placeholder="Area Code"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Area Type</div>
                          <div>
                            <input
                              {...register('area_type')}
                              type="text"
                              placeholder="Area Type"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Level</div>
                          <div>
                            <input
                              {...register('level')}
                              type="text"
                              placeholder="Level"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">TIN No</div>
                          <div>
                            <input
                              {...register('tin_no')}
                              type="text"
                              placeholder="TIN No"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">UMID No</div>
                          <div>
                            <input
                              {...register('umid_no')}
                              type="text"
                              placeholder="UMID No"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* End Second Column */}
              </div>
              <hr className="my-6 mx-4" />
              <div className="w-full px-4">
                <div className="app__label_standard">
                  <label className="flex items-center space-x-1">
                    <input
                      {...register('confirmed', { required: true })}
                      type="checkbox"
                      className=""
                    />
                    <span className="font-normal text-xs">
                      By checking this box, you acknowledge that all information
                      is accurate and up-to-date.
                    </span>
                  </label>
                  {errors.confirmed && (
                    <div className="app__error_message">
                      Confirmation is required
                    </div>
                  )}
                </div>
              </div>
              <div className="app__modal_footer">
                <button type="submit" className="app__btn_green_sm">
                  {saving ? 'Saving..' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Disapprove Confirmation Modal */}
      {showConfirmRemoveModal && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message="Are you sure you want to this employee from the item?"
          onConfirm={handleConfirmedRemove}
          onCancel={() => setShowConfirmRemoveModal(false)}
        />
      )}
    </>
  )
}

export default PlantillaDetails
