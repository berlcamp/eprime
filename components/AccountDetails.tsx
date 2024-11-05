'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  fetchDistricts,
  fetchItems,
  fetchOffices,
  fetchPositions,
  fetchSchools,
  handleConvertEmployeeToNonTeaching,
  handleConvertEmployeeToTeaching,
  logError
} from '@/utils/fetchApi'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Avatar from 'react-avatar'
import { useForm } from 'react-hook-form'
import uuid from 'react-uuid'
import OneColLayoutLoading from './Loading/OneColLayoutLoading'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useDispatch, useSelector } from 'react-redux'

// Types
import type {
  DistrictTypes,
  Employee,
  ItemTypes,
  LeaveCreditTypes,
  Office,
  PositionTypes,
  SchoolTypes
} from '@/types'
import { format, isValid, parseISO } from 'date-fns'
import Link from 'next/link'
import CustomButton from './CustomButton'
import PlantillaDetails from './PlantillaDetails'

interface ModalProps {
  hideModal: () => void
  id: string
  shouldUpdateRedux: boolean
}

const AccountDetails = ({ hideModal, shouldUpdateRedux, id }: ModalProps) => {
  const { setToast, hasAccess } = useFilter()
  const { supabase } = useSupabase()

  const [positionTypeChange, setPositionTypeChange] = useState('')
  const [slBalance, setSlBalance] = useState(0)
  const [vlBalance, setVlBalance] = useState(0)
  const [vlslBalance, setVlslBalance] = useState(0)
  const [scBalance, setScBalance] = useState(0)

  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<PositionTypes[] | []>([])
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')

  const [userData, setUserData] = useState<Employee | null>(null)

  const [loadingSchools, setLoadingSchools] = useState(false)
  const [assignment, setAssignment] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedOffice, setSelectedOffice] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [schools, setSchools] = useState<SchoolTypes[] | []>([])
  const [districts, setDistricts] = useState<DistrictTypes[] | null>(null)
  const [offices, setOffices] = useState<Office[] | []>([])

  const [showItemModal, setShowItemModal] = useState(false)
  const [item, setItem] = useState<ItemTypes | null>(null)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const router = useRouter()

  // Check access from employee_accounts settings or Super Admins
  const isAdmin = hasAccess('employee_accounts')

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    watch
  } = useForm<Employee>({
    mode: 'onSubmit'
  })

  const watchedSalaryStep = watch('salary_step')

  const onSubmit = async (formdata: Employee) => {
    if (loading || saving) return

    void handleUpdate(formdata)
  }

  const handleUpdate = async (formdata: Employee) => {
    setSaving(true)

    let newData

    const district =
      formdata.assignment === 'school' ? Number(formdata.district_id) : null
    const school =
      formdata.assignment === 'school' ? Number(formdata.school_id) : null
    const office =
      formdata.assignment === 'office' ? Number(formdata.office_id) : null

    if (isAdmin) {
      newData = {
        firstname: formdata.firstname,
        middlename: formdata.middlename,
        lastname: formdata.lastname,
        assignment: formdata.assignment,
        birthday: formdata.birthday ? new Date(formdata.birthday) : null, // use the string data before storing the redux to avoid error
        district_id: district,
        school_id: school,
        office_id: office,
        position_id: formdata.position_id ? formdata.position_id : null,
        salary_grade: formdata.salary_grade,
        salary_step: formdata.salary_step,
        date_of_next_step_increment:
          formdata.salary_step.toString() !== '8'
            ? formdata.date_of_next_step_increment
            : null, // no more next increment if step = 8,
        position_type: formdata.position_type
        // joining date and date of last promotion has been remove as it is manage on plantilla item
        // date_of_last_promotion: formdata.date_of_last_promotion
        //   ? new Date(formdata.date_of_last_promotion)
        //   : null, // use the string data before storing the redux to avoid error
        // joining_date: formdata.joining_date
        //   ? new Date(formdata.joining_date)
        //   : null // use the string data before storing the redux to avoid error
      }
    } else {
      newData = {
        firstname: formdata.firstname,
        middlename: formdata.middlename,
        lastname: formdata.lastname,
        assignment: formdata.assignment,
        birthday: formdata.birthday ? new Date(formdata.birthday) : null, // use the string data before storing the redux to avoid error
        district_id: district,
        school_id: school,
        office_id: office
      }
    }

    try {
      const { error } = await supabase
        .from('hrm_users')
        .update(newData)
        .eq('id', id)

      if (error) {
        void logError(
          'Update account details',
          'hrm_assignments',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      if (shouldUpdateRedux) {
        console.log('redux updated')
        const items = [...globallist]
        const updatedDropdownData = getUpdatedDropdownData(formdata)
        const updatedData = {
          ...newData,
          birthday: formdata.birthday,
          id,
          ...updatedDropdownData
        }
        const foundIndex = items.findIndex((x) => x.id === updatedData.id)
        items[foundIndex] = { ...items[foundIndex], ...updatedData }
        dispatch(updateList(items))
      }

      // Update leave if position type is changed
      if (positionTypeChange === 'Non-teaching') {
        void handleConvertEmployeeToNonTeaching(
          id,
          formdata.date_of_next_increment
        )
      }
      if (positionTypeChange === 'Teaching') {
        void handleConvertEmployeeToTeaching(id)
      }

      // pop up the success message
      setToast('success', 'Successfully saved.')

      setSaving(false)

      router.refresh()

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    }
  }

  const getUpdatedDropdownData = (formdata: Employee) => {
    let json = {}

    // Positions
    const pos = positions.filter(
      (x) => x.id.toString() === formdata.position_id.toString()
    )
    if (pos.length > 0) {
      json = { ...json, hrm_positions: { id: pos[0].id, name: pos[0].name } }
    }

    // schools
    const sch = schools?.filter((x) => x.id.toString() === formdata.school_id)
    if (sch.length > 0) {
      json = { ...json, hrm_schools: { id: sch[0].id, name: sch[0].name } }
    }

    // offices
    const off = offices?.filter((x) => x.id.toString() === formdata.office_id)
    if (off.length > 0) {
      json = { ...json, hrm_offices: { id: off[0].id, name: off[0].name } }
    }

    return json
  }

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId)
    setLoadingSchools(true)

    const result = await fetchSchools({ filterDistrictId: districtId }, 300, 0)

    setSchools(result.data.length > 0 ? result.data : [])
    setLoadingSchools(false)
  }

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('hrm_users')
          .select('*, hrm_positions:position_id(name)')
          .eq('id', id)
          .limit(1)
          .single()

        if (error) throw new Error(error.message)

        setUserData(data)

        setAvatarUrl(data.avatar_url)
        setAssignment(data.assignment)
        setSelectedDistrict(data.district_id ?? '')
        setSelectedSchool(data.school_id ?? '')
        setSelectedOffice(data.office_id ?? '')
        setSelectedPosition(data.position_id ?? '')

        // Update school list dropdown
        if (data.assignment === 'school')
          void handleDistrictChange(data.district_id)

        reset({
          firstname: data ? data.firstname : '',
          middlename: data ? data.middlename : '',
          lastname: data ? data.lastname : '',
          assignment: data ? data.assignment : '',
          birthday: data?.birthday ? data.birthday : '',
          district_id: data ? data.district_id : '',
          school_id: data ? data.school_id : '',
          office_id: data ? data.office_id : '',
          position_id: data ? data.position_id : '',
          position_type: data ? data.position_type : '',
          salary_grade: data ? data.salary_grade : '',
          salary_step: data ? data.salary_step : '',
          date_of_next_step_increment: data
            ? data.date_of_next_step_increment
            : ''
          // joining date and date of last promotion has been remove as it is manage on plantilla item
          // joining_date: data?.joining_date ? data.joining_date : '',
          // date_of_last_promotion: data?.date_of_last_promotion
          //   ? data.date_of_last_promotion
          //   : ''
        })
      } catch (e) {
        console.error('fetch error: ', e)
      } finally {
        setLoading(false)
      }
    }

    const fetchPositionsData = async () => {
      const result = await fetchPositions('', 300, 0)
      setPositions(result.data.length > 0 ? result.data : [])
    }

    const fetchDistrictsData = async () => {
      const result = await fetchDistricts('', 300, 0)
      setDistricts(result.data.length > 0 ? result.data : null)
    }

    const fetchOfficesData = async () => {
      const result = await fetchOffices('', 300, 0)
      setOffices(result.data.length > 0 ? result.data : [])
    }

    const fetchItem = async () => {
      const result = await fetchItems({ filterUser: id }, 9, 0)
      if (result.data.length > 0) {
        setItem(result.data[0])
      }
    }
    void fetchDistrictsData()
    void fetchOfficesData()

    void fetchAccountDetails()
    void fetchPositionsData()
    void fetchItem()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset])

  const handleChangePositionType = async (type: string) => {
    if (!userData) return

    // Current Balances
    const { data: balancesData } = await supabase
      .from('hrm_leave_credits')
      .select()
      .eq('user_id', id)

    const balances: Array<{
      type: string
      balance: string
    }> = []

    if (balancesData && balancesData.length > 0) {
      const creditsData: LeaveCreditTypes[] = balancesData
      creditsData.forEach((credit) => {
        balances.push({
          type: credit.type,
          balance: credit.credits.toString()
        })
      })
    }

    // Count Service Credits balance if teaching
    if (
      (type === 'Non-teaching' || type === 'Teaching-Related') &&
      userData.position_type === 'Teaching'
    ) {
      if (balances.length > 0) {
        const scList = balances.find((item) => item.type === 'Service Credit')

        // first index of array should be the latest and updated balance
        const sc = scList?.balance ?? 0
        setScBalance(Number(sc))

        // formula to convert sc to vl/sl as amended by CSC MC No.41, s. 1998
        const vlsl = (30 * Number(sc)) / 69
        setVlslBalance(vlsl)

        // display the change to the UI
        setPositionTypeChange('Non-teaching')
      }
    }

    // Count VL/SL balance if non-teaching
    if (type === 'Teaching' && userData.position_type !== 'Teaching') {
      if (balances.length > 0) {
        const vlList = balances.find((item) => item.type === 'Vacation Leave')
        const slList = balances.find((item) => item.type === 'Sick Leave')

        // first index of array should be the latest and updated balance
        const sl = slList?.balance ?? 0
        const vl = vlList?.balance ?? 0
        setSlBalance(Number(sl))
        setVlBalance(Number(vl))

        // formula to convert vl/sl to sc as amended by CSC MC No.41, s. 1998
        const sc = ((Number(vl) + Number(sl)) / 30) * 69
        setScBalance(sc)

        // display the change to the UI
        setPositionTypeChange('Teaching')
      }
    }

    if (type === '' || type === userData.position_type) {
      setPositionTypeChange('')
    }
  }

  const salaryGradeOptions = []
  for (let i = 1; i <= 33; i++) {
    salaryGradeOptions.push(
      <option key={i} value={i}>
        {i}
      </option>
    )
  }
  const salaryStepOptions = []
  for (let i = 1; i <= 8; i++) {
    salaryStepOptions.push(
      <option key={i} value={i}>
        {i}
      </option>
    )
  }

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Account Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            {/* Modal Content */}
            <div className="app__modal_body">
              {loading && <OneColLayoutLoading rows={3} />}
              {!loading && (
                <form onSubmit={handleSubmit(onSubmit)} className="">
                  <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
                    {/* Begin First Column */}
                    <div className="w-full px-4">
                      <div className="text-center">
                        {avatarUrl && avatarUrl !== '' ? (
                          <div className="mx-auto relative rounded-full overflow-hidden h-16 w-16 border border-gray-300">
                            <Image
                              src={avatarUrl}
                              layout="fill"
                              objectFit="cover"
                              alt="profile image"
                              className="rounded"
                            />
                          </div>
                        ) : (
                          <Avatar
                            round={false}
                            size="60"
                            name={userData?.firstname}
                          />
                        )}
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">First Name:</div>
                          <div>
                            <input
                              {...register('firstname', { required: true })}
                              type="text"
                              className="app__input_standard"
                            />
                            {errors.firstname && (
                              <div className="app__error_message">
                                First Name is required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Middle Name:
                          </div>
                          <div>
                            <input
                              {...register('middlename')}
                              type="text"
                              className="app__input_standard"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Last Name:</div>
                          <div>
                            <input
                              {...register('lastname', { required: true })}
                              type="text"
                              className="app__input_standard"
                            />
                            {errors.lastname && (
                              <div className="app__error_message">
                                Last Name is required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">Birthday:</div>
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
                            Original assignment
                          </div>
                          <div>
                            <select
                              {...register('assignment', { required: true })}
                              value={assignment}
                              onChange={(e) => setAssignment(e.target.value)}
                              className="app__select_standard"
                            >
                              <option value="">Choose</option>
                              <option value="school">School</option>
                              <option value="office">Division Office</option>
                            </select>
                            {errors.assignment && (
                              <div className="app__error_message">
                                Assignment is required
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {assignment === 'school' && (
                        <>
                          <div className="app__form_field_container">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Choose district
                              </div>
                              <div>
                                <select
                                  {...register('district_id', {
                                    required: true
                                  })}
                                  onChange={async (e) =>
                                    await handleDistrictChange(e.target.value)
                                  }
                                  value={selectedDistrict}
                                  className="app__select_standard"
                                >
                                  <option value="">Choose</option>
                                  {districts?.map((item) => (
                                    <option key={uuid()} value={item.id}>
                                      {item.name}
                                    </option>
                                  ))}
                                </select>
                                {errors.district_id && (
                                  <div className="app__error_message">
                                    District is required
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {loadingSchools && (
                        <div className="">
                          <OneColLayoutLoading rows={1} />
                        </div>
                      )}
                      {assignment === 'school' && !loadingSchools && (
                        <>
                          <div className="app__form_field_container">
                            <div className="w-full">
                              <div className="app__label_standard">
                                Choose School
                              </div>
                              <div>
                                <select
                                  {...register('school_id', { required: true })}
                                  value={selectedSchool}
                                  onChange={(e) =>
                                    setSelectedSchool(e.target.value)
                                  }
                                  className="app__select_standard"
                                >
                                  <option value="">Choose</option>
                                  {schools.map((item) => (
                                    <option key={uuid()} value={item.id}>
                                      {item.name}
                                    </option>
                                  ))}
                                </select>
                                {errors.school_id && (
                                  <div className="app__error_message">
                                    School is required
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {assignment === 'office' && (
                        <div className="app__form_field_container">
                          <div className="w-full">
                            <div className="app__label_standard">
                              Choose office
                            </div>
                            <div>
                              <select
                                {...register('office_id', { required: true })}
                                value={selectedOffice}
                                onChange={(e) =>
                                  setSelectedOffice(e.target.value)
                                }
                                className="app__select_standard"
                              >
                                <option value="">Choose</option>
                                {offices.map((item) => (
                                  <option key={uuid()} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                              {errors.office_id && (
                                <div className="app__error_message">
                                  Office is required
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* End First Column */}
                    {/* Begin Second Column */}
                    <div className="w-full px-4">
                      <div className="text-base text-center font-medium text-gray-600">
                        EDITABLE ONLY BY HR
                      </div>
                      <div className="flex items-center">
                        <div className="flex-grow bg-gray-300 h-px"></div>
                        <div className="mx-4 my-4 text-gray-500 text-sm">
                          Position Settings
                        </div>
                        <div className="flex-grow bg-gray-300 h-px"></div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Current Position:
                          </div>
                          {!isAdmin ? (
                            <div className="app__label_value">
                              {userData ? userData.hrm_positions?.name : ''}
                            </div>
                          ) : (
                            <div>
                              <select
                                {...register('position_id', { required: true })}
                                value={selectedPosition}
                                onChange={(e) =>
                                  setSelectedPosition(e.target.value)
                                }
                                className="app__input_standard"
                              >
                                <option value="">Choose Position</option>
                                {positions.map((position: PositionTypes) => (
                                  <option key={uuid()} value={position.id}>
                                    {position.name}
                                  </option>
                                ))}
                              </select>
                              {errors.position_id && (
                                <div className="app__error_message">
                                  Current Position is required
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Current Position Type:
                          </div>
                          {!isAdmin ? (
                            <div className="app__label_value">
                              {userData ? userData.position_type : ''}
                            </div>
                          ) : (
                            <div>
                              <select
                                {...register('position_type', {
                                  required: true
                                })}
                                onChange={(e) =>
                                  handleChangePositionType(e.target.value)
                                }
                                className="app__input_standard"
                              >
                                <option value="">Choose Type</option>
                                <option value="Teaching">Teaching</option>
                                <option value="Teaching-Related">
                                  Teaching-Related
                                </option>
                                <option value="Non-teaching">
                                  Non-teaching
                                </option>
                              </select>
                              {errors.position_type && (
                                <div className="app__error_message">
                                  Position Type is required
                                </div>
                              )}
                            </div>
                          )}
                          <div className="text-gray-600 italic mt-1">
                            (Changing position type will convert either VL/SL to
                            Service Credit or Service Credit to VL/SL)
                          </div>
                        </div>
                        {positionTypeChange === 'Non-teaching' && (
                          <div className="ml-4 text-xs text-gray-700">
                            <span className="text-green-700 font-bold">
                              {Number(scBalance).toFixed(3)}
                            </span>{' '}
                            Service Credits will be converted to{' '}
                            <span className="text-green-700 font-bold">
                              {(vlslBalance / 2).toFixed(3)}
                            </span>{' '}
                            VL and{' '}
                            <span className="text-green-700 font-bold">
                              {(vlslBalance / 2).toFixed(3)}
                            </span>{' '}
                            SL
                          </div>
                        )}
                        {positionTypeChange === 'Teaching' && (
                          <div className="ml-4 text-xs text-gray-700">
                            <span className="text-green-700 font-bold">
                              {Number(vlBalance).toFixed(3)}
                            </span>{' '}
                            VL and{' '}
                            <span className="text-green-700 font-bold">
                              {Number(slBalance).toFixed(3)}
                            </span>{' '}
                            SL will be converted to{' '}
                            {Number(scBalance).toFixed(3)} Service Credit
                          </div>
                        )}
                      </div>
                      {positionTypeChange === 'Non-teaching' && (
                        <div className="app__form_field_container">
                          <div className="w-full">
                            <div className="app__label_standard">
                              Specify date of next VL/SL Increment:
                            </div>
                            <div>
                              <input
                                {...register('date_of_next_increment', {
                                  required: true
                                })}
                                type="date"
                                className="app__input_standard"
                              />
                              {errors.date_of_next_increment && (
                                <div className="app__error_message">
                                  Specify date of next VL/SL increment
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center">
                        <div className="flex-grow bg-gray-300 h-px"></div>
                        <div className="mx-4 my-4 text-gray-500 text-sm">
                          NOSI/NOSA Settings
                        </div>
                        <div className="flex-grow bg-gray-300 h-px"></div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Current Salary Grade:
                          </div>
                          {!isAdmin ? (
                            <div className="app__label_value">
                              {userData ? userData.salary_grade : ''}
                            </div>
                          ) : (
                            <div>
                              <select
                                {...register('salary_grade')}
                                className="app__select_standard"
                              >
                                <option value="">Choose Salary Grade</option>
                                {salaryGradeOptions}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Current Salary Grade (Step):
                          </div>
                          {!isAdmin ? (
                            <div className="app__label_value">
                              {userData ? userData.salary_step : ''}
                            </div>
                          ) : (
                            <div>
                              <select
                                {...register('salary_step')}
                                className="app__select_standard"
                              >
                                <option value="">
                                  Choose Salary Grade (Step)
                                </option>
                                {salaryStepOptions}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                      {watchedSalaryStep !== '8' && (
                        <div className="app__form_field_container">
                          <div className="w-full">
                            <div className="app__label_standard">
                              Date of next Step Increment:
                            </div>
                            {!isAdmin ? (
                              <div className="app__label_value">
                                {userData &&
                                isValid(
                                  parseISO(userData.date_of_next_step_increment)
                                )
                                  ? format(
                                      parseISO(
                                        userData.date_of_next_step_increment
                                      ),
                                      'MMMM d, yyyy'
                                    )
                                  : ''}
                              </div>
                            ) : (
                              <div>
                                <input
                                  {...register('date_of_next_step_increment')}
                                  type="date"
                                  className="app__input_standard"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* // joining date and date of last promotion has been remove as it is manage on plantilla item */}
                      {/* <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Joining Date:
                          </div>
                          {!isAdmin ? (
                            <div className="app__label_value">
                              {userData ? userData.joining_date : ''}
                            </div>
                          ) : (
                            <div>
                              <input
                                {...register('joining_date')}
                                type="date"
                                className="app__input_standard"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="app__form_field_container">
                        <div className="w-full">
                          <div className="app__label_standard">
                            Date of Last Promotion:
                          </div>
                          {!isAdmin ? (
                            <div className="app__label_value">
                              {userData ? userData.date_of_last_promotion : ''}
                            </div>
                          ) : (
                            <div>
                              <input
                                {...register('date_of_last_promotion')}
                                type="date"
                                className="app__input_standard"
                              />
                            </div>
                          )}
                        </div>
                      </div> */}
                      {isAdmin && (
                        <>
                          <div className="flex items-center">
                            <div className="flex-grow bg-gray-300 h-px"></div>
                            <div className="mx-4 my-4 text-gray-500 text-sm">
                              Plantilla
                            </div>
                            <div className="flex-grow bg-gray-300 h-px"></div>
                          </div>
                          <div className="app__form_field_container">
                            <div className="w-full">
                              {item ? (
                                <CustomButton
                                  containerStyles="app__btn_blue"
                                  title="View Plantilla"
                                  isDisabled={saving}
                                  btnType="button"
                                  handleClick={() => setShowItemModal(true)}
                                />
                              ) : (
                                <div>
                                  Employee currently do not have plantilla yet.
                                  Go to{' '}
                                  <Link
                                    href="/items"
                                    className="font-bold text-blue-700"
                                  >
                                    Plantilla Items
                                  </Link>{' '}
                                  to create plantilla for this emplyee.
                                </div>
                              )}
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
                          By checking this box, you acknowledge that all
                          information is accurate and up-to-date.
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
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Item Modal */}
      {item && showItemModal && (
        <PlantillaDetails
          editData={item}
          hideModal={() => setShowItemModal(false)}
        />
      )}
    </>
  )
}

export default AccountDetails
