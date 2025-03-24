'use client'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/components/supabase-provider'
import uuid from 'react-uuid'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'

export default function AddEdit ({ editData, handleUpdateList, handleInsertToList, hideModal, viewMode }) {
  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()
  const [saving, setSaving] = useState(false)

  // Objectives
  const [selectedObjectives, setSelectedObjectives] = useState(null)
  const [kra, setKra] = useState('')
  const [objective, setObjective] = useState('')
  const [mov, setMov] = useState('')
  const [objectiveWeight, setObjectiveWeight] = useState('')
  const [qualityRating, setQualityRating] = useState('')
  const [efficiencyRating, setEfficiencyRating] = useState('')
  const [timelinessRating, setTimelinessRating] = useState('')
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

  const fetchData = async () => {
    if (editData) {
      const { data, error } = await supabase
        .from('chiefs_opcrf')
        .select('objectives')
        .eq('id', editData.id)
        .limit(1)
        .single()

      if (error) console.error('fetchData error', error)

      setSelectedObjectives(data.objectives)
    } else {
      setSelectedObjectives([])
    }
  }

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
      user_id: session.user.id,
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
      .from('chiefs_opcrf')
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
      .from('chiefs_opcrf')
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
  const handleSelectedObjective = () => {
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
      id: uuid(),
      kra,
      title: objective,
      mov,
      weight: objectiveWeight,
      quality_rating: qualityRating,
      efficiency_rating: efficiencyRating,
      timeliness_rating: timelinessRating,
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

  const handleEditSelectedObjective = (item, index) => {
    console.log(item.quality_rating, item.efficiency_rating, item.timeliness_rating)
    setErrorObjMessage(null)
    setEditObjective(true)
    setEditIndex(index)
    setKra(item.kra)
    setObjective(item.title)
    setMov(item.mov)
    setObjectiveWeight(item.weight)
    setQualityRating(item.quality_rating)
    setEfficiencyRating(item.efficiency_rating)
    setTimelinessRating(item.timeliness_rating)
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

  const handleResetAddObjective = () => {
    setErrorObjMessage(null)
    setAddObjective(false)
    setEditObjective(false)
    setKra('')
    setObjective('')
    setMov('')
    setObjectiveWeight('')
    setQualityRating('')
    setEfficiencyRating('')
    setTimelinessRating('')
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

  useEffect(() => {
    fetchData()
  }, [])

  return (

      <div className="z-50 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                OPCRF Details
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body relative p-4 overflow-x-scroll">
              <div className='grid grid-cols-1 gap-4 mb-4'>
                <div className='w-full'>
                  <div className='text-gray-600 font-medium text-sm mb-1 dark:text-gray-300'>OPCRF Title:</div>
                  <div>
                    {
                      !viewMode
                        ? <>
                            <input
                              {...register('title', { required: true })}
                              type="text"
                              className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'/>
                            {errors.title && <div className='mt-1 text-xs text-red-600 font-bold'>OPCRF Title is required</div>}
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
                      onClick={e => setAddObjective(true)}
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
                              <td className='font-bold py-2'>KRA</td>
                              <td className=''>
                                <input
                                  value={kra}
                                  onChange={e => setKra(e.target.value)}
                                  className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'
                                />
                              </td>
                            </tr>
                            <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                              <td className='font-bold py-2'>OBJECTIVE</td>
                              <td className=''>
                                <input
                                  value={objective}
                                  onChange={e => setObjective(e.target.value)}
                                  className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'
                                />
                              </td>
                            </tr>
                            <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                              <td className='font-bold py-2'>MOV</td>
                              <td className=''>
                                <input
                                  value={mov}
                                  onChange={e => setMov(e.target.value)}
                                  className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'
                                />
                              </td>
                            </tr>
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
