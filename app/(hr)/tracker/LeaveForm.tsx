import { CustomButton, LeaveBalanceBoxes, SearchUserInput } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { generateReferenceCode } from '@/utils/text-helper'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Types
import type { Employee, LeaveTypes, SalaryGradeTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { leaveTypes } from '@/constants'
import { fetchSalaryGrades, logError } from '@/utils/fetchApi'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useDropzone, type FileWithPath } from 'react-dropzone'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
}

const LeaveForm = ({ hideModal }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase, session, systemUsers } = useSupabase()
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeTypes[] | []>([])
  const [monetizationAmount, setMonetizationAmount] = useState('')

  const [selectedImages, setSelectedImages] = useState<any>([])
  const [saving, setSaving] = useState(false)
  const [leaveType, setLeaveType] = useState('')
  const [approverError, setApproverError] = useState('')

  // selected approver
  const [user, setUser] = useState<Employee | null>(null)

  const currentUser: Employee = systemUsers.find(
    (user: Employee) => user.id === session.user.id
  )

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          filename: file.name
        })
      )
    )
  }, [])

  const maxSize = 5242880 // 5 MB in bytes
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.docx'],
      'application/vnd.ms-excel': ['.xlsx']
    },
    maxSize
  })

  const {
    register,
    formState: { errors },
    reset,
    watch,
    handleSubmit
  } = useForm<LeaveTypes>({
    mode: 'onSubmit'
  })

  const watchedOtherPurpose = watch('other_purpose')
  const watchedDays = watch('days')

  const onSubmit = async (formdata: LeaveTypes) => {
    if (!user) {
      setApproverError('This field is required')
    }
    await handleCreate(formdata)
  }

  const handleCreate = async (formdata: LeaveTypes) => {
    if (!user) return

    setSaving(true)

    const refCode = generateReferenceCode()

    try {
      const newData = {
        type: 'Leave',
        reference_code: refCode,
        leave_type: formdata.type,
        leave_location: formdata.location,
        leave_specify_location: formdata.specify_location,
        leave_hospitalization: formdata.hospitalization,
        leave_illness: formdata.illness,
        leave_women_illness: formdata.women_illness,
        leave_study_purpose: formdata.study_purpose,
        leave_other_purpose: formdata.other_purpose,
        leave_days: formdata.days,
        leave_from: formdata.from,
        leave_to: formdata.to,
        leave_commutation: formdata.commutation,
        created_by: session.user.id,
        current_approver_id: session.user.id,
        receiver_id: user.id,
        current_status: 'For Verification',
        current_tracker: 'Forwarded'
      }

      const { data, error }: { data: any; error: any } = await supabase
        .from('hrm_request_trackers')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create Leave Request',
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

      const { error: error2 } = await supabase.from('hrm_tracker_flow').insert([
        {
          tracker_id: data[0].id,
          user_id: currentUser.id,
          status: 'For Verification'
        },
        {
          tracker_id: data[0].id,
          user_id: currentUser.id,
          receiver_id: user.id,
          status: 'Forwarded'
        }
      ])

      if (error2) {
        void logError(
          'Create Leave Request Tracker Flow',
          'hrm_tracker_flow',
          JSON.stringify({
            tracker_id: data[0].id,
            user_id: currentUser.id,
            status: 'For Verification'
          }),
          error2.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error2.message)
      }

      // Upload files
      await handleUploadFiles(data[0].id)

      // Notify receiver
      void handleNotifyReceiver(data[0].id, user.id, refCode)

      // Append new data in redux
      const updatedData = {
        id: data[0].id,
        creator: currentUser,
        approver: currentUser,
        receiver: user,
        created_at: data[0].created_at,
        document_tracker_stickies: [],
        ...newData
      }
      dispatch(updateList([updatedData, ...globallist]))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      // pop up the success message
      setToast('success', 'Successfully saved.')
      setApproverError('')

      // reset all form fields
      reset()

      hideModal()
    } catch (error) {
      console.error('error', error)
    }

    setSaving(false)
  }

  useEffect(() => {
    if (watchedOtherPurpose !== '') {
      const salary = salaryGrades.find(
        (s) =>
          s.grade.toString() === currentUser.salary_grade.toString() &&
          s.step.toString() === currentUser.salary_step.toString()
      )
      if (salary) {
        const moneyValue =
          Number(salary.salary) * Number(watchedDays) * 0.0478087
        // setMonetizationAmount(moneyValue.toFixed(2).toString())
        setMonetizationAmount(
          moneyValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedOtherPurpose, watchedDays])

  const handleNotifyReceiver = async (
    trackerId: string,
    receiverId: string,
    refCode: string
  ) => {
    //
    try {
      // insert to notifications
      const { error: error3 } = await supabase
        .from('hrm_notifications')
        .insert({
          message: `New Leave Request #${refCode} has been forwarded to you for recommendation/approval.`,
          url: `/tracker/${refCode}`,
          type: 'Forwarded',
          user_id: receiverId,
          request_tracker_id: trackerId,
          reference_table: 'hrm_request_trackers'
        })

      if (error3) {
        throw new Error(error3.message)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleUploadFiles = async (id: string) => {
    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: File) => {
        const { error } = await supabase.storage
          .from('hrm_documents')
          .upload(`requests/${id}/${file.name}`, file)
        if (error) console.log(error)
      })
    )
  }

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter(
      (f: FileWithPath) => f.path !== file.path
    )
    setSelectedImages(files)
  }

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div
      key={index}
      className="flex space-x-1 py-px items-center justify-start relative align-top"
    >
      <XMarkIcon
        onClick={() => deleteFile(file)}
        className="cursor-pointer w-5 h-5 text-red-400"
      />
      <span className="text-xs">{file.filename}</span>
    </div>
  ))

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0])
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileRejections])

  useEffect(() => {
    const fetchSalaryGradesData = async () => {
      const result = await fetchSalaryGrades(999, 0)
      setSalaryGrades(result.data.length > 0 ? result.data : [])
    }

    void fetchSalaryGradesData()
  }, [])

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
          {/* Begin First Column */}
          <div className="w-full px-4">
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Leave Type</div>
                <div>
                  <select
                    {...register('type', { required: true })}
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="app__select_standard"
                  >
                    <option value="">Choose</option>
                    {leaveTypes.map((item, index) => (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <div className="app__error_message">Type is required</div>
                  )}
                </div>
              </div>
            </div>
            {(leaveType === 'Vacation Leave' ||
              leaveType === 'Special Privilege Leave') && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      In case of Vacation/Special Privilege Leave:
                    </div>
                    <div>
                      <select
                        {...register('location', { required: true })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="Within the Philippines">
                          Within the Philippines
                        </option>
                        <option value="Abroad">Abroad</option>
                      </select>
                      {errors.location && (
                        <div className="app__error_message">
                          Location is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Specify location</div>
                    <div>
                      <input
                        {...register('specify_location', { required: true })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.specify_location && (
                        <div className="app__error_message">
                          Location is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {leaveType === 'Sick Leave' && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      In case of Sick Leave
                    </div>
                    <div>
                      <select
                        {...register('hospitalization', { required: true })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="In Hospital">In Hospital</option>
                        <option value="Out Patient">Out Patient</option>
                      </select>
                      {errors.hospitalization && (
                        <div className="app__error_message">
                          This is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Specify illness</div>
                    <div>
                      <input
                        {...register('illness', { required: true })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.illness && (
                        <div className="app__error_message">
                          Please specify illness
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {leaveType === 'Special Leave Benefits for Women' && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      In case of Special Leave Benefits for Women, specify
                      illness
                    </div>
                    <div>
                      <input
                        {...register('women_illness', { required: true })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.illness && (
                        <div className="app__error_message">
                          Please specify illness
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {leaveType === 'Study Leave' && (
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    In case of Study Leave
                  </div>
                  <div>
                    <select
                      {...register('study_purpose', { required: true })}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      <option value="Completion of Masters Degree">
                        Completion of Masters Degree
                      </option>
                      <option value="BAR/Board Examination Review">
                        BAR/Board Examination Review
                      </option>
                    </select>
                    {errors.study_purpose && (
                      <div className="app__error_message">
                        Purpose is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {leaveType === 'Others' && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      Other Purpose (Optional)
                    </div>
                    <div>
                      <select
                        {...register('other_purpose')}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="Monetization of Leave Credits">
                          Monetization of Leave Credits
                        </option>
                        <option value="Terminal Leave">Terminal Leave</option>
                      </select>
                    </div>
                  </div>
                </div>
                {watch('other_purpose') !== '' && (
                  <div className="app__form_field_container">
                    <LeaveBalanceBoxes user={currentUser} />
                  </div>
                )}
              </>
            )}
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">
                  Number of working days applied for
                </div>
                <div>
                  <input
                    {...register('days', { required: true })}
                    type="number"
                    className="app__select_standard"
                  />
                  {errors.days && (
                    <div className="app__error_message">Days is required</div>
                  )}
                </div>
              </div>
            </div>
            {watch('other_purpose') !== '' && (
              <div className="app__form_field_container">
                <span className="app__label_standard">
                  Money Value:{' '}
                  <span className="font-bold text-green-700">
                    P {monetizationAmount}
                  </span>
                </span>
              </div>
            )}
          </div>
          {/* End First Column */}
          {/* Begin Second Column */}
          <div className="w-full px-4">
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Start Date</div>
                <div>
                  <input
                    {...register('from', { required: true })}
                    type="date"
                    className="app__select_standard"
                  />
                  {errors.from && (
                    <div className="app__error_message">
                      Start Date is required
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">End Date</div>
                <div>
                  <input
                    {...register('to', { required: true })}
                    type="date"
                    className="app__select_standard"
                  />
                  {errors.to && (
                    <div className="app__error_message">
                      End Date is required
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Commutation</div>
                <div>
                  <select
                    {...register('commutation')}
                    className="app__select_standard"
                  >
                    <option value="Not Requested">Not Requested</option>
                    <option value="Requested">Requested</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Attachment</div>
                <div
                  {...getRootProps()}
                  className="cursor-pointer border-2 border-dashed border-gray-300 bg-gray-100 text-gray-600 px-4 py-10"
                >
                  <input {...getInputProps()} />
                  <p className="text-xs">
                    Drag and drop some files here, or click to select files
                  </p>
                </div>
                {fileRejections.length === 0 && selectedImages.length > 0 && (
                  <div className="py-4">
                    <div className="text-xs font-medium mb-2">
                      Files to upload:
                    </div>
                    {selectedFiles}
                  </div>
                )}
                {fileRejections.length > 0 && (
                  <div className="py-4">
                    <p className="text-red-500 text-xs">
                      File rejected. Please make sure its an image, PDF, DOC, or
                      Excel file and less than 5MB.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* End Second Column */}
        </div>
        <hr className="my-6" />
        <div className="w-full lg:w-1/2 px-4">
          <div className="app__form_field_container">
            <div className="w-full">
              <div className="app__label_standard">
                Submit for Recommendation/Approval To
              </div>
              <SearchUserInput
                isMultiple={false}
                excludedIds={[session.user.id]}
                handleSelectedUsers={handleSelectedUsers}
              />
              {approverError !== '' && (
                <div className="app__error_message">{approverError}</div>
              )}
            </div>
          </div>
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
                By checking this box, you acknowledge that all information is
                accurate and cannot be modified after submission.
              </span>
            </label>
            {errors.confirmed && (
              <div className="app__error_message">Confirmation is required</div>
            )}
          </div>
        </div>
        <div className="app__modal_footer px-4">
          <CustomButton
            btnType="submit"
            isDisabled={saving}
            title={saving ? 'Saving...' : 'Save'}
            containerStyles="app__btn_green"
          />
        </div>
      </form>
    </>
  )
}

export default LeaveForm
