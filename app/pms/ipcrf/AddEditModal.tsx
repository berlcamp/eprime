'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { Employee, namesType } from '@/types'
import { IpcrfTemplateTypes, IpcrfTypes } from '@/types/pmsTypes'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'react-uuid'

interface ModalProps {
  editData: IpcrfTypes | null
  ipcrfTemplates: IpcrfTemplateTypes[]
  list: IpcrfTypes[]
  hideModal: () => void
}

export default function AddEdit({
  editData,
  ipcrfTemplates,
  list,
  hideModal
}: ModalProps) {
  const { setToast } = useFilter()
  const { supabase, systemUsers, session } = useSupabase()

  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [searchResults, setSearchResults] = useState<namesType[]>([])
  const [selectedItems, setSelectedItems] = useState<namesType[] | []>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<IpcrfTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: IpcrfTypes) => {
    if (selectedItems.length === 0) {
      setErrorMessage('Rater is Required')
      return
    }

    if (editData) {
      setSaving(true)
      void handleUpdate()
    } else {
      if (
        list.some(
          (item) => item.ipcrf_template_id === formdata.ipcrf_template_id
        )
      ) {
        setErrorMessage('This IPCRF template was already added.')
        return
      }
      setSaving(true)

      void handleCreate(formdata)
    }

    setSaving(false)
  }

  const handleCreate = async (formdata: IpcrfTypes) => {
    // Get objectives and competencies from template
    const { data: template } = await supabase
      .from('ipcrf_templates')
      .select('objectives, competencies')
      .eq('id', formdata.ipcrf_template_id)
      .limit(1)
      .single()

    const { data, error } = await supabase
      .from('ipcrfs')
      .insert({
        user_id: session.user.id,
        ipcrf_template_id: formdata.ipcrf_template_id,
        rater_user_id: selectedItems[0].id,
        objectives: template.objectives,
        competencies: template.competencies
      })
      .select()

    if (!error) {
      // Append new data to list
      const title = getIpcrfTitle(formdata.ipcrf_template_id)

      // Append new data in redux
      const updatedData = {
        id: data[0].id,
        ipcrf_template: { title },
        rater: { ...selectedItems[0] },
        rater_user_id: selectedItems[0].id,
        ipcrf_template_id: formdata.ipcrf_template_id,
        status: data[0].status
      }
      dispatch(updateList([updatedData, ...globallist]))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1
        })
      )

      // Store to notifications for rater
      const { error } = await supabase.from('notifications').insert({
        user_id: selectedItems[0].id,
        type: 'ipcrf',
        reference_id: data[0].id,
        message: 'You are added as rater to IPCRF',
        url: '/pms/ipcrf',
        reference_table: 'ipcrfs'
      })

      if (error) console.error(error)

      // pop up the success message
      setToast('success', 'Successfully saved.')

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } else {
      console.error(error)
    }
  }

  const handleUpdate = async () => {
    if (!editData) return

    const { error } = await supabase
      .from('ipcrfs')
      .update({
        rater_user_id: selectedItems[0].id
      })
      .eq('id', editData.id)

    if (error) console.error(error)

    // Update data in redux
    const items = [...globallist]
    const updatedData = {
      ...editData,
      rater_user_id: selectedItems[0].id,
      rater: { ...selectedItems[0] },
      ipcrf_template_id: editData.ipcrf_template_id,
      id: editData.id
    }
    const foundIndex = items.findIndex((x) => x.id === updatedData.id)
    items[foundIndex] = { ...items[foundIndex], ...updatedData }
    dispatch(updateList(items))

    // Update notification row if rater is changed
    const { error: notificationUpdateError } = await supabase
      .from('notifications')
      .update({
        user_id: selectedItems[0].id,
        is_read: false
      })
      .eq('reference_id', editData.id)
      .eq('type', 'ipcrf')

    if (notificationUpdateError) console.error(error)

    // pop up the success message
    setToast('success', 'Successfully saved.')

    // hide the modal
    hideModal()

    // reset all form fields
    reset()
  }

  const getIpcrfTitle = (id: string) => {
    return ipcrfTemplates.find((item) => item.id.toString() === id)?.title ?? ''
  }

  // Search employees
  const handleSearchUser = async (value: string) => {
    const searchTerm = value

    setSearchUser(value)

    if (searchTerm.trim().length < 3) {
      setSearchResults([])
      return
    }

    // Search user
    const searchWords = value.split(' ')
    const results = (systemUsers as namesType[]).filter((user) => {
      const fullName =
        `${user.lastname} ${user.firstname} ${user.middlename}`.toLowerCase()
      return searchWords.every((word) => fullName.includes(word))
    })
    setSearchResults(results)
  }

  const handleSelected = (item: namesType) => {
    setSelectedItems([item])

    setSearchResults([])
    setSearchUser('')
  }
  const handleRemoveSelected = (id: string) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.filter((item) => item.id.toString() !== id)
    )
  }

  useEffect(() => {
    if (editData) {
      const managers = (systemUsers as Employee[]).filter(
        (user) => user.id.toString() === editData.rater_user_id
      )
      setSelectedItems(managers)
    }
  }, [systemUsers])

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
              {!editData ? 'Choose From IPCRF Template' : 'Edit Rater'}
            </h5>
            <button
              onClick={hideModal}
              type="button"
              className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
            >
              &times;
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="modal-body relative p-4"
          >
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div>
                  {editData ? (
                    <span>{getIpcrfTitle(editData.ipcrf_template_id)}</span>
                  ) : (
                    <>
                      <select
                        {...register('ipcrf_template_id', { required: true })}
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                      >
                        <option value=""></option>
                        {ipcrfTemplates?.map((item) => (
                          <option key={uuid()} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                      {errors.ipcrf_template_id && (
                        <div className="mt-1 text-xs text-red-600 font-bold">
                          This is required
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  Rater:
                </div>
                <div className="bg-white p-1 border border-gray-300 rounded-sm">
                  {selectedItems.length > 0 &&
                    selectedItems.map((item) => (
                      <div key={uuid()} className="w-full flex mb-1">
                        <span className="inline-flex items-center text-sm  border border-gray-400 rounded-sm px-1 bg-gray-300">
                          {item.firstname} {item.middlename} {item.lastname}
                          <XMarkIcon
                            onClick={() => handleRemoveSelected(item.id)}
                            className="w-4 h-4 ml-2 cursor-pointer"
                          />
                        </span>
                      </div>
                    ))}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Rater"
                      value={searchUser}
                      onChange={(e) => handleSearchUser(e.target.value)}
                      className="w-full text-sm py-1 px-2 text-gray-600 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                    />

                    {searchResults && (
                      <div className="absolute top-7 left-0 z-50 w-full bg-gray-200 border">
                        {searchResults.map((item: namesType) => (
                          <div
                            key={uuid()}
                            onClick={() => handleSelected(item)}
                            className="p-1 w-full text-gray-700 cursor-pointer hover:bg-gray-300 text-sm"
                          >
                            {item.firstname} {item.middlename} {item.lastname}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {errorMessage && (
                  <div className="mt-1 text-xs text-red-600 font-bold">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
              >
                {saving ? 'Saving..' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
