'use client'
import React, { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import uuid from 'react-uuid'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import { useFilter } from '@/context/FilterContext'

export default function DevelopmentPlanModal ({ opcrfId, viewMode, hideModal }) {
  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const [saving, setSaving] = useState(false)

  const [funcComps, setFuncComps] = useState(null)
  const [objectives, setObjectives] = useState(null)
  const [errorFuncMessage, setErrorFuncMessage] = useState(null)
  const [addFunc, setAddFunc] = useState(false)
  const [editFunc, setEditFunc] = useState(false)
  const [editIndex, setEditIndex] = useState(false)

  const [strength, setStrength] = useState('')
  const [weak, setWeak] = useState('')
  const [intervention, setIntervention] = useState('')
  const [learningObjective, setLearningObjective] = useState('')
  const [timeline, setTimeline] = useState('')
  const [resources, setResources] = useState('')

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('chiefs_opcrf')
      .select('objectives,development_plans')
      .eq('id', opcrfId)
      .limit(1)
      .single()

    if (error) {
      console.error(error)
    } else {
      const funcs = data.development_plans ? data.development_plans.filter(item => item.type === 'functional') : []
      setFuncComps(funcs.length > 0 ? funcs[0].data : [])
      setObjectives(data.objectives)
    }
  }

  /**
   * Begin Functional competencies
   */
  const handleAddFunc = () => {
    setAddFunc(true)
    setErrorFuncMessage(null)
    setStrength('')
    setWeak('')
    setIntervention('')
    setLearningObjective('')
    setTimeline('')
    setResources('')
  }

  const handleCancelFunc = () => {
    setAddFunc(false)
    setEditFunc(false)
    setErrorFuncMessage(null)
    setStrength('')
    setWeak('')
    setIntervention('')
    setLearningObjective('')
    setTimeline('')
    setResources('')
  }

  const handleRemoveFunc = (index) => {
    const temp = [...funcComps]
    temp.splice(index, 1)
    setFuncComps(temp)
  }

  const handleEditFunc = (item, index) => {
    setErrorFuncMessage(null)
    setEditFunc(true)
    setEditIndex(index)
    setStrength(item.strength_objective_id)
    setWeak(item.weak_objective_id)
    setLearningObjective(item.learning_objectives)
    setIntervention(item.intervention)
    setTimeline(item.timeline)
    setResources(item.resources_needed)
  }

  const handleSaveFunc = () => {
    if (strength.trim() === '' ||
      weak.trim() === '' ||
      learningObjective.trim() === '' ||
      intervention.trim() === '' ||
      timeline.trim() === '' ||
      resources.trim() === '') {
      setErrorFuncMessage('Please fill up all forms')
      return
    }

    const findDuplicateStrength = funcComps.filter((item, index) => {
      if (editIndex === index) { // exclude if on edit mode
        return false
      }
      return item.strength_objective_id === strength
    })
    const findDuplicateWeak = funcComps.filter((item, index) => {
      if (editIndex === index) { // exclude if on edit mode
        return false
      }
      return item.weak_objective_id === weak
    })

    if (findDuplicateStrength.length > 0) {
      setErrorFuncMessage('This strength was already added')
      return
    }
    if (findDuplicateWeak.length > 0) {
      setErrorFuncMessage('This development needs was already added')
      return
    }

    const newData = {
      strength_objective_id: strength,
      strength_objective_title: getObjectiveTitle(strength),
      weak_objective_id: weak,
      weak_objective_title: getObjectiveTitle(weak),
      learning_objectives: learningObjective,
      intervention,
      timeline,
      resources_needed: resources
    }

    // If edit mode
    if (editFunc) {
      const replace = [
        ...funcComps.slice(0, editIndex), // Copy the elements before the replaced object
        newData, // Add the replaced object
        ...funcComps.slice(editIndex + 1) // Copy the elements after the replaced object
      ]
      setFuncComps(replace)
    } else {
      const updatedData = [...funcComps, { ...newData }]
      setFuncComps(updatedData)
    }

    setErrorFuncMessage(null)
    setEditIndex(false)
    setAddFunc(false)
    setEditFunc(false)
    setStrength('')
    setWeak('')
    setIntervention('')
    setLearningObjective('')
    setTimeline('')
    setResources('')
  }
  /**
   * End Functional competencies
   */

  const handleSave = async () => {
    setSaving(true)
    const newData = [
      {
        type: 'functional',
        data: funcComps
      }
    ]

    const { error } = await supabase
      .from('chiefs_opcrf')
      .update({ development_plans: newData })
      .eq('id', opcrfId)

    if (error) {
      console.error(error)
    } else {
      setSaving(false)

      // pop up the success message
      setToast('success', 'Successfully saved.')

      hideModal()
    }
  }

  const getObjectiveTitle = (id) => {
    const obj = objectives.filter(item => item.id === id)
    return obj[0].title
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
      <div className="z-50 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
        <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
          <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
            <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Development Plan
              </h5>
              <button onClick={hideModal} type="button" className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline">&times;</button>
            </div>

            { !funcComps && <TwoColTableLoading/> }

            { funcComps &&

              <div className="modal-body relative p-4 overflow-x-scroll">

                <div className='grid grid-cols-1 gap-4 mt-4'>
                  <div className='text-gray-600 font-medium dark:text-gray-300'>FUNCTIONAL COMPETENCIES:</div>
                  <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                          <th className="py-2 px-2"></th>
                          <th className="py-2 px-2">Strengths</th>
                          <th className="py-2 px-2">Development Needs</th>
                          <th className="py-2 px-2">Learning Objectives</th>
                          <th className="py-2 px-2">Intervention</th>
                          <th className="py-2 px-2">Timeline</th>
                          <th className="py-2 px-2">Resources Needed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        funcComps?.map((item, index) => (
                          <tr key={uuid()}>
                              <td className="py-2 px-2">
                              {
                                !viewMode &&
                                  <div className='flex space-x-2'>
                                    <TrashIcon
                                      onClick={e => handleRemoveFunc(index)}
                                      className='w-4 h-4 cursor-pointer'/>
                                    <PencilSquareIcon
                                      onClick={e => handleEditFunc(item, index)}
                                      className='w-4 h-4 cursor-pointer'/>
                                  </div>
                              }
                              </td>
                              <td className="py-2 px-2 text-xs">{item.strength_objective_title}</td>
                              <td className="py-2 px-2 text-xs">{item.weak_objective_title}</td>
                              <td className="py-2 px-2 text-xs">{item.learning_objectives}</td>
                              <td className="py-2 px-2 text-xs">{item.intervention}</td>
                              <td className="py-2 px-2 text-xs">{item.timeline}</td>
                              <td className="py-2 px-2 text-xs">{item.resources_needed}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                  {
                    (!addFunc && !editFunc && !viewMode) &&
                    <div className='flex items-center justify-center space-x-2 text-xs mb-6'>
                      <button
                        type="button"
                        onClick={handleAddFunc}
                        className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-xs text-white rounded-sm">
                        Add Row
                      </button>
                    </div>
                  }
                  {
                    (addFunc || editFunc) &&
                      <div className='p-2 border-2 border-gray-400 border-dashed'>
                        <div className='p-4 space-y-2 bg-gray-200 text-xs'>
                          {
                            errorFuncMessage &&
                              <div className='flex items-center justify-center space-x-2 text-xs'>
                                {errorFuncMessage && <div className='mt-1 text-xs text-red-600 font-bold'>{errorFuncMessage}</div>}
                              </div>
                          }
                          <table className="w-full mx-2 text-sm text-left text-gray-600 dark:text-gray-400">
                            <tbody>
                              <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                <td className='font-bold py-2 w-40'>Strength</td>
                                <td className=''>
                                  <select
                                    value={strength}
                                    onChange={e => setStrength(e.target.value)}
                                    className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                                      <option value=''>Choose Strength</option>
                                      {
                                        objectives.map(item => (
                                          <option key={uuid()} value={item.id}>{item.title}</option>
                                        ))
                                      }
                                  </select>
                                </td>
                              </tr>
                              <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                                <td className='font-bold py-2'>Development Needs</td>
                                <td className=''>
                                  <select
                                    value={weak}
                                    onChange={e => setWeak(e.target.value)}
                                    className='w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300'>
                                      <option value=''>Choose Development Needs</option>
                                      {
                                        objectives.map(item => (
                                          <option key={uuid()} value={item.id}>{item.title}</option>
                                        ))
                                      }
                                  </select>
                                </td>
                              </tr>
                              <tr className="dark:bg-gray-800 dark:border-gray-700">
                                <td className='font-bold py-2'>Learning Objectives</td>
                                <td className=''>
                                  <textarea
                                    onChange={e => setLearningObjective(e.target.value)}
                                    value={learningObjective}
                                    className='focus:outline-none border w-full ring-0 p-2'/>
                                </td>
                              </tr>
                              <tr className="dark:bg-gray-800 dark:border-gray-700">
                                <td className='font-bold py-2'>Intervention</td>
                                <td className=''>
                                  <textarea
                                    onChange={e => setIntervention(e.target.value)}
                                    value={intervention}
                                    className='focus:outline-none border w-full ring-0 p-2'/>
                                </td>
                              </tr>
                              <tr className="dark:bg-gray-800 dark:border-gray-700">
                                <td className='font-bold py-2'>Timeline</td>
                                <td className=''>
                                  <textarea
                                    onChange={e => setTimeline(e.target.value)}
                                    value={timeline}
                                    className='focus:outline-none border w-full ring-0 p-2'/>
                                </td>
                              </tr>
                              <tr className="dark:bg-gray-800 dark:border-gray-700">
                                <td className='font-bold py-2'>Resources Needed</td>
                                <td className=''>
                                  <textarea
                                    onChange={e => setResources(e.target.value)}
                                    value={resources}
                                    className='focus:outline-none border w-full ring-0 p-2'/>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                  }
                  {
                    (addFunc || editFunc) &&
                    <div className='flex items-center justify-center space-x-2 bg-gray-50 text-xs'>
                      <button
                        type="button"
                        onClick={handleSaveFunc}
                        className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-xs text-white rounded-sm">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelFunc}
                        className="bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-xs text-white rounded-sm">
                        Cancel
                      </button>
                    </div>
                  }
                </div>

                {
                  (!addFunc && !editFunc) &&
                    <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                        {
                          !viewMode &&
                            <button
                              type="button"
                              disabled={saving}
                              onClick={handleSave}
                              className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                            >
                              {saving ? 'Saving..' : 'Save'}
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
              </div>

            }

          </div>
        </div>
      </div>

  )
}
