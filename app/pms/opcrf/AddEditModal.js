'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/components/supabase-provider'
import uuid from 'react-uuid'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { fullTextQuery } from '@/utils/text-helper'

export default function AddEdit ({ editData, opcrfTemplates, list, handleInsertToList, handleUpdateList, hideModal }) {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [errorMessage, setErrorMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [selectedItems, setSelectedItems] = useState(editData ? (editData.rater ? [editData.rater] : []) : [])

  const { register, formState: { errors }, reset, handleSubmit } = useForm({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata) => {
    if (selectedItems.length === 0) {
      setErrorMessage('Rater is Required')
      return
    }

    if (saving) return

    if (editData) {
      setSaving(true)
      handleUpdate(formdata)
    } else {
      if (list.some(item => item.opcrf_template_id === formdata.opcrf_template_id)) {
        setErrorMessage('This OPCRF template was already added.')
        return
      }
      setSaving(true)
      handleCreate(formdata)
    }

    setSaving(false)
  }

  const handleCreate = async (formdata) => {
    // Get objectives from template
    const { data: template } = await supabase
      .from('opcrf_templates')
      .select('objectives')
      .eq('id', formdata.opcrf_template_id)
      .limit(1)
      .single()

    const { data, error } = await supabase
      .from('opcrfs')
      .insert({
        user_id: session.user.id,
        opcrf_template_id: formdata.opcrf_template_id,
        rater_user_id: selectedItems[0].id,
        objectives: template.objectives
      })
      .select()

    if (!error) {
      // Append new data to list
      const rater = await getRaterName(selectedItems[0].id)
      const title = getOpcrfTitle(formdata.opcrf_template_id)

      handleInsertToList({
        id: data[0].id,
        opcrf_templates: { title },
        rater: { id: selectedItems[0].id, ...rater },
        opcrf_template_id: formdata.opcrf_template_id,
        status: data[0].status
      })

      // Store to notifications for rater
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedItems[0].id,
          type: 'opcrf',
          reference_id: data[0].id,
          message: 'You are added as rater to OPCRF',
          url: '/pms/opcrf'
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

  const handleUpdate = async (formdata) => {
    const { error } = await supabase
      .from('opcrfs')
      .update({
        rater_user_id: selectedItems[0].id
      })
      .eq('id', editData.id)

    if (error) console.error(error)

    const rater = await getRaterName(selectedItems[0].id)
    const title = getOpcrfTitle(editData.opcrf_template_id)

    const updatedData = {
      rater_user_id: selectedItems[0].id,
      opcrf_templates: { title },
      rater: { id: selectedItems[0].id, ...rater },
      opcrf_template_id: editData.opcrf_template_id,
      id: editData.id
    }

    handleUpdateList(updatedData)

    // Update notification row if rater is changed
    const { error: notificationUpdateError } = await supabase
      .from('notifications')
      .update({
        user_id: selectedItems[0].id,
        is_read: false
      })
      .eq('reference_id', editData.id)
      .eq('type', 'opcrf')

    if (notificationUpdateError) console.error(error)

    // pop up the success message
    setToast('success', 'Successfully saved.')

    // hide the modal
    hideModal()

    // reset all form fields
    reset()
  }

  const getRaterName = async (id) => {
    const { data, error } = await supabase
      .from('users')
      .select('firstname,middlename,lastname')
      .eq('id', id)
      .limit(1)
      .single()

    if (error) console.error(error)

    return data
  }

  const getOpcrfTitle = (id) => {
    const obj = opcrfTemplates.filter(item => item.id === id)
    return obj[0].title
  }

  const handleSearchUser = async (e) => {
    setSearchUser(e.target.value)
    setErrorMessage(null)

    if (e.target.value.trim().length < 3) {
      setSearchResults(null)
      return
    }

    let query = supabase
      .from('users')
      .select()
      .textSearch('fullname', fullTextQuery(e.target.value))

    // Excluded already selected items
    selectedItems.forEach(item => {
      query = query.neq('id', item.id)
    })

    // Limit results
    query = query.limit(3)

    const { data, error } = await query

    if (error) console.error(error)

    data.length > 0 ? setSearchResults(data) : setSearchResults(null)
  }

  const handleSelected = (item) => {
    setSelectedItems([item])

    setSearchResults(null)
    setSearchUser('')
  }
  const handleRemoveSelected = (id) => {
    setSelectedItems(prevSelectedItems => prevSelectedItems.filter(item => item.id !== id))
  }

  return (

      <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] max-w-lg my-6 mx-auto relative w-auto pointer-events-none">
          <div className="max-h-full overflow-hidden border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                {!editData ? 'Choose From OPCRF Template' : 'Edit Rater'}
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body relative p-4">
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>OPCRF Template:</div>
                  <div>
                    {
                      editData
                        ? (
                          <span>{getOpcrfTitle(editData.opcrf_template_id)}</span>
                          )
                        : (
                            <>
                            <select
                              {...register('opcrf_template_id', { required: true })}
                              value={templateId}
                              onChange={e => setTemplateId(e.target.value)}
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                                <option value=""></option>
                                {
                                  opcrfTemplates?.map(item => (
                                    <option key={uuid()} value={item.id}>{item.title}</option>
                                  ))
                                }
                            </select>
                            {errors.opcrf_template_id && <div className='mt-1 text-xs text-red-600 font-bold'>This is required</div>}
                            </>
                          )
                    }

                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>Rater:</div>
                  <div className='bg-white p-1 border border-gray-300 rounded-sm'>
                    {
                      selectedItems.length > 0 &&
                        selectedItems.map(item => (
                          <div key={uuid()} className='w-full flex mb-1'>
                            <span className='inline-flex items-center text-sm  border border-gray-400 rounded-sm px-1 bg-gray-300'>
                              {item.firstname} {item.middlename} {item.lastname}
                              <XMarkIcon onClick={() => handleRemoveSelected(item.id)} className='w-4 h-4 ml-2 cursor-pointer'/>
                            </span>
                          </div>
                        ))
                    }
                    <div className='relative'>
                      <input
                        type="text"
                        placeholder='Search Rater'
                        value={searchUser}
                        onChange={(e) => handleSearchUser(e)}
                        className='w-full text-sm py-1 px-2 text-gray-600 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'
                      />

                        {
                          searchResults &&
                            <div className='absolute top-7 left-0 z-50 w-full bg-gray-200 border'>
                              {
                                searchResults.map(item => (
                                  <div
                                    key={uuid()}
                                    onClick={() => handleSelected(item)}
                                    className='p-1 w-full text-gray-700 cursor-pointer hover:bg-gray-300 text-sm'>
                                      {item.firstname} {item.middlename} {item.lastname}
                                  </div>
                                ))
                              }
                            </div>
                        }
                    </div>
                  </div>
                  {errorMessage && <div className='mt-1 text-xs text-red-600 font-bold'>{errorMessage}</div>}
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
