'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/components/supabase-provider'
import uuid from 'react-uuid'
import { CheckIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'

export default function AddEdit ({ editData, handleUpdateList, kras, objectives, handleInsertToList, hideModal, viewMode }) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Objectives
  const [selectedObjectives, setSelectedObjectives] = useState(editData?.objectives?.length > 0 ? editData.objectives : [])
  const [kraId, setKraId] = useState('')
  const [objectivesList, setObjectivesList] = useState(null)
  const [objectiveId, setObjectiveId] = useState('')
  const [objectiveWeight, setObjectiveWeight] = useState('')
  const [objectiveHasEfficiency, setObjectiveHasEfficiency] = useState('')
  const [objectiveHasTimeliness, setObjectiveHasTimeliness] = useState('')
  const [qPE1, setQPE1] = useState('')
  const [qPE2, setQPE2] = useState('')
  const [qPE3, setQPE3] = useState('')
  const [qPE4, setQPE4] = useState('')
  const [qPE5, setQPE5] = useState('')
  const [ePE1, setEPE1] = useState('')
  const [ePE2, setEPE2] = useState('')
  const [ePE3, setEPE3] = useState('')
  const [ePE4, setEPE4] = useState('')
  const [ePE5, setEPE5] = useState('')
  const [tPE1, setTPE1] = useState('')
  const [tPE2, setTPE2] = useState('')
  const [tPE3, setTPE3] = useState('')
  const [tPE4, setTPE4] = useState('')
  const [tPE5, setTPE5] = useState('')
  const [errorObjMessage, setErrorObjMessage] = useState(null)
  const [addObjective, setAddObjective] = useState(false)
  const [editObjective, setEditObjective] = useState(false)
  const [editIndex, setEditIndex] = useState(false)

  const { register, formState: { errors }, reset, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      title: editData ? editData.title : ''
    }
  })

  const onSubmit = async (formdata) => {
    setSaving(true)

    const newData = {
      title: formdata.title,
      objectives: selectedObjectives
    }

    if (editData) {
      await handleUpdate(newData)
    } else {
      await handleCreate(newData)
    }
    setSaving(false)
  }

  const handleCreate = async (newData) => {
    if (selectedObjectives.length === 0) {
      setErrorObjMessage('Objectives are required')
      return
    }

    const { data, error } = await supabase
      .from('opcrf_templates')
      .insert(newData)
      .select()

    if (!error) {
      // Append new data to list
      handleInsertToList({ ...newData, id: data[0].id })

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

  const handleUpdate = async (newData) => {
    const { error } = await supabase
      .from('opcrf_templates')
      .update(newData)
      .eq('id', editData.id)

    if (!error) {
      // update state
      handleUpdateList({ ...newData, id: editData.id })

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

  /*
   * Objectives
   */
  const handleKraChange = (id) => {
    const obj = objectives.filter(item => item.kra_id === Number(id))
    setObjectivesList(obj)
    setKraId(id)
  }

  const handleSelectedObjective = () => {
    const find = selectedObjectives.filter((obj, index) => {
      if (editIndex === index) { // exclude if on edit mode
        return false
      }
      return obj.id === objectiveId
    })
    if (find.length > 0) {
      setErrorObjMessage('This objective is already added')
      return
    }
    if (objectiveId.trim() === '') {
      setErrorObjMessage('Objective is required')
      return
    }
    if (objectiveWeight.trim() === '') {
      setErrorObjMessage('Weight is required')
      return
    }
    const weightSum = selectedObjectives?.reduce((partialSum, obj, index) => {
      if (editIndex !== index) { // exclude if on edit mode
        return partialSum + Number(obj.weight)
      }
      return partialSum
    }, 0)

    if ((weightSum + Number(objectiveWeight)) > 100) {
      setErrorObjMessage('Total objectives weight must not exceed 100')
      return
    }

    const items = {
      id: objectiveId,
      kra_id: kraId,
      title: getObjectiveTitle(objectiveId),
      weight: objectiveWeight,
      has_efficiency: objectiveHasEfficiency,
      has_timeliness: objectiveHasTimeliness,
      qPE1,
      qPE2,
      qPE3,
      qPE4,
      qPE5,
      ePE1,
      ePE2,
      ePE3,
      ePE4,
      ePE5,
      tPE1,
      tPE2,
      tPE3,
      tPE4,
      tPE5
    }

    // If edit mode
    if (editObjective) {
      const replacedSelectedObjectives = [
        ...selectedObjectives.slice(0, editIndex), // Copy the elements before the replaced object
        items, // Add the replaced object
        ...selectedObjectives.slice(editIndex + 1) // Copy the elements after the replaced object
      ]
      setSelectedObjectives(replacedSelectedObjectives)
    } else {
      setSelectedObjectives([...selectedObjectives, items])
    }
    setEditIndex(false)
    setAddObjective(false)
    setEditObjective(false)
    setErrorObjMessage(null)
    handleResetAddObjective()
  }

  const handleRemoveSelectedObjective = (id) => {
    setSelectedObjectives(prevSelectedObjectives => prevSelectedObjectives.filter(item => item.id !== id))
  }

  const handleAddObjective = () => {
    setAddObjective(true)
    setEditObjective(false)
    setObjectivesList(null)
  }

  const handleEditSelectedObjective = (item, index) => {
    handleKraChange(item.kra_id) // Get objectives by KRA ID

    setErrorObjMessage(null)
    setEditObjective(true)
    setAddObjective(false)
    setEditIndex(index)
    setKraId(item.kra_id)
    setObjectiveId(item.id)
    setObjectiveWeight(item.weight)
    setObjectiveHasEfficiency(item.has_efficiency)
    setObjectiveHasTimeliness(item.has_timeliness)
    setQPE1(item.qPE1)
    setQPE2(item.qPE2)
    setQPE3(item.qPE3)
    setQPE4(item.qPE4)
    setQPE5(item.qPE5)
    setEPE1(item.ePE1)
    setEPE2(item.ePE2)
    setEPE3(item.ePE3)
    setEPE4(item.ePE4)
    setEPE5(item.ePE5)
    setTPE1(item.tPE1)
    setTPE2(item.tPE2)
    setTPE3(item.tPE3)
    setTPE4(item.tPE4)
    setTPE5(item.tPE5)
  }

  const getObjectiveTitle = (id) => {
    const obj = objectives.filter(item => item.id === Number(id))
    return obj[0].title.length > 100 ? obj[0].title.slice(0, 100) + '...' : obj[0].title
  }

  const handleResetAddObjective = () => {
    setErrorObjMessage(null)
    setAddObjective(false)
    setEditObjective(false)
    setKraId('')
    setObjectiveId('')
    setObjectiveWeight('')
    setObjectiveHasEfficiency('')
    setObjectiveHasTimeliness('')
    setQPE1('')
    setQPE2('')
    setQPE3('')
    setQPE4('')
    setQPE5('')
    setEPE1('')
    setEPE2('')
    setEPE3('')
    setEPE4('')
    setEPE5('')
    setTPE1('')
    setTPE2('')
    setTPE3('')
    setTPE4('')
    setTPE5('')
  }
  /*
   * End - Objectives
   */

  return (

      <div className="z-50 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                OPCRF Template Details
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body relative p-4 overflow-x-scroll">
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>OPCRF Template Title:</div>
                  <div>
                    {
                      !viewMode
                        ? <>
                            <input
                              {...register('title', { required: true })}
                              type="text"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                            {errors.title && <div className='mt-1 text-xs text-red-600 font-bold'>OPCRF Template Title is required</div>}
                          </>
                        : <span>{editData.title}</span>
                    }
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 mt-10 mb-4 border p-2'>
                <div className='text-gray-600 font-medium dark:text-gray-300'>OBJECTIVES:</div>
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                  <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                          <th className="py-2 px-2"></th>
                          <th className="py-2 px-2">Objective</th>
                          <th className="py-2 px-2">Weight</th>
                          <th className="py-2 px-2">Rating Settings</th>
                      </tr>
                  </thead>
                  <tbody>
                    {
                      selectedObjectives?.map((item, index) => (
                        <tr
                          key={uuid()}
                          className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600">
                          <td className="px-2 py-2 flex space-x-3">
                            {
                              !viewMode &&
                                <div className='flex space-x-2'>
                                  <TrashIcon
                                    onClick={e => handleRemoveSelectedObjective(item.id)}
                                    className='w-4 h-4 cursor-pointer'/>
                                  <PencilSquareIcon
                                    onClick={e => handleEditSelectedObjective(item, index)}
                                    className='w-4 h-4 cursor-pointer'/>
                                </div>
                            }
                          </td>
                          <td className="px-2 py-2">
                            { item.title }
                          </td>
                          <td>
                            {item.weight}
                          </td>
                          <td>
                            <div className='flex items-center space-x-2'>
                              { item.cot_1 && <span className='flex items-center space-x-1 text-green-600 font-medium'><CheckIcon className='w-4 h-4'/>COT1</span> }
                              { item.cot_2 && <span className='flex items-center space-x-1 text-green-600 font-medium'><CheckIcon className='w-4 h-4'/>COT2</span> }
                              { item.cot_3 && <span className='flex items-center space-x-1 text-green-600 font-medium'><CheckIcon className='w-4 h-4'/>COT3</span> }
                              { item.cot_4 && <span className='flex items-center space-x-1 text-green-600 font-medium'><CheckIcon className='w-4 h-4'/>COT4</span> }
                              { item.has_efficiency && <span className='flex items-center space-x-2 text-green-600 font-medium'><CheckIcon className='w-4 h-4'/>Efficiency</span> }
                              { item.has_timeliness && <span className='flex items-center space-x-2 text-green-600 font-medium'><CheckIcon className='w-4 h-4'/>Timeliness</span> }
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                    <tr className="bg-gray-50 text-xs dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-2 py-4" colSpan={4}>
                        <span className='font-medium'>Total Weight: {selectedObjectives?.reduce((partialSum, obj) => partialSum + Number(obj.weight), 0)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {
                  (errorObjMessage) &&
                    <div className='flex items-center justify-center space-x-2 bg-gray-50 text-xs'>
                      {errorObjMessage && <div className='mt-1 text-xs text-red-600 font-bold'>{errorObjMessage}</div>}
                    </div>
                }
                {
                  (!addObjective && !editObjective && !viewMode) &&
                  <div className='flex items-center justify-center space-x-2 bg-gray-50 text-xs'>
                    <button
                      type="button"
                      onClick={handleAddObjective}
                      className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-xs text-white rounded-sm">
                      Add Objective
                    </button>
                  </div>
                }
                {
                  (addObjective || editObjective) &&
                    <div className='p-2 border-2 border-gray-400 border-dashed'>
                      <div className='p-4 space-y-2 bg-gray-200 text-xs'>
                        <table className="w-full mx-2 text-sm text-left text-gray-600 dark:text-gray-400">
                          <tbody>
                            <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                              <td className='font-bold py-2  w-20'>KRA</td>
                              <td className=''>
                                <select
                                  value={kraId}
                                  onChange={e => handleKraChange(e.target.value)}
                                  className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                                    <option key={uuid()} value=''>Choose KRA</option>
                                    {
                                      kras.map(item => (
                                        <option key={uuid()} value={item.id}>{item.title.slice(0, 100)} {item.title.length > 100 && '...'}</option>
                                      ))
                                    }
                                </select>
                              </td>
                            </tr>
                            {
                              ((objectivesList && objectivesList.length > 0) || editObjective) &&
                                <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                  <td className='font-bold py-2'>Objective</td>
                                  <td className=''>
                                    <select
                                      value={objectiveId}
                                      onChange={e => setObjectiveId(e.target.value)}
                                      className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                                        <option key={uuid()} value=''>Choose Objective</option>
                                        {
                                          objectivesList?.map(item => (
                                            <option key={uuid()} value={item.id}>{item.title.slice(0, 100)} {item.title.length > 100 && '...'}</option>
                                          ))
                                        }
                                    </select>
                                  </td>
                                </tr>
                            }
                            <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                              <td className='font-bold py-2'>Weight</td>
                              <td className=''>
                                <input
                                  type='number'
                                  value={objectiveWeight}
                                  onChange={e => setObjectiveWeight(e.target.value)}
                                  step='any'
                                  className='h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12'/>
                              </td>
                            </tr>
                            <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                              <td className='font-bold py-2'>Ratings</td>
                              <td className=''>
                                <div className='flex items-start justify-start space-x-3'>
                                  <div className='flex'>
                                    <input
                                      defaultChecked={objectiveHasEfficiency}
                                      onChange={e => setObjectiveHasEfficiency(!objectiveHasEfficiency)}
                                      id='has_efficiency'
                                      type='checkbox'/>
                                    <label htmlFor='has_efficiency' className='px-1'>Has&nbsp;Efficiency</label>
                                  </div>
                                  <div className='flex'>
                                    <input
                                      defaultChecked={objectiveHasTimeliness}
                                      onChange={e => setObjectiveHasTimeliness(!objectiveHasTimeliness)}
                                      id='has_timeliness'
                                      type='checkbox'/>
                                    <label htmlFor='has_timeliness' className='px-1'>Has&nbsp;Timeliness</label>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className='font-light text-lg text-gray-600 text-center py-4'>Performance Indicators</div>
                          <table className="w-full mx-2 text-sm text-left text-gray-600 dark:text-gray-400">
                            <thead>
                              <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                <th></th>
                                <th>Outstanding (5)</th>
                                <th>Very Satisfactory (4)</th>
                                <th>Satisfactory (3)</th>
                                <th>Unsatisfactory (2)</th>
                                <th>Poor (1)</th>
                              </tr>
                            </thead>
                            <tbody>
                                <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                  <td className="py-2 font-bold">
                                    Quality
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setQPE1(e.target.value)}
                                      value={qPE1}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setQPE2(e.target.value)}
                                      value={qPE2}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setQPE3(e.target.value)}
                                      value={qPE3}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setQPE4(e.target.value)}
                                      value={qPE4}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setQPE5(e.target.value)}
                                      value={qPE5}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                </tr>
                                <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                  <td className="py-2 font-bold">
                                    Efficiency
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setEPE1(e.target.value)}
                                      value={ePE1}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setEPE2(e.target.value)}
                                      value={ePE2}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setEPE3(e.target.value)}
                                      value={ePE3}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setEPE4(e.target.value)}
                                      value={ePE4}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setEPE5(e.target.value)}
                                      value={ePE5}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                </tr>
                                <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                  <td className="py-2 font-bold">
                                    Timeliness
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setTPE1(e.target.value)}
                                      value={tPE1}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setTPE2(e.target.value)}
                                      value={tPE2}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setTPE3(e.target.value)}
                                      value={tPE3}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setTPE4(e.target.value)}
                                      value={tPE4}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                  <td className="py-2">
                                    <textarea
                                      onChange={e => setTPE5(e.target.value)}
                                      value={tPE5}
                                      className='focus:outline-none ring-0 p-1'/>
                                  </td>
                                </tr>
                            </tbody>
                          </table>
                          <div className='flex items-center justify-center space-x-2 mb-4'>
                            <button
                              type="button"
                              onClick={handleSelectedObjective}
                              className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm">
                              {addObjective ? 'Add' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={handleResetAddObjective}
                              className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm">
                              Cancel
                            </button>
                          </div>
                      </div>
                    </div>
                }
              </div>

              {
                (!addObjective && !editObjective) &&
                  <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                      {
                        !viewMode &&
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                          >
                            {saving ? 'Saving..' : 'Save Settings'}
                          </button>
                      }
                      <button
                        type="button"
                        onClick={hideModal}
                        disabled={saving}
                        className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                      >
                        Close
                      </button>
                  </div>
              }
            </form>

          </div>
        </div>
      </div>

  )
}
