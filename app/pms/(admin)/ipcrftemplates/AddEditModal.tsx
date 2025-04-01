/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { PositionTypes } from '@/types'
import {
  CompetencyTypes,
  IpcrfObjectiveTypes,
  IpcrfTemplateTypes,
  KraObjectiveTypes,
  KraTypes
} from '@/types/pmsTypes'
import {
  CheckIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'react-uuid'

interface ModalProps {
  editData: IpcrfTemplateTypes | null

  positions: PositionTypes[]
  kras: KraTypes[]
  objectives: KraObjectiveTypes[]
  competencies: CompetencyTypes[]

  hideModal: () => void
  viewMode: boolean
}

export default function AddEdit({
  editData,
  positions,
  kras,
  objectives,
  competencies,
  hideModal,
  viewMode
}: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Positions
  const [searchPosition, setSearchPosition] = useState('')
  const [searchResults, setSearchResults] = useState<PositionTypes[] | null>(
    null
  )
  const [selectedItems, setSelectedItems] = useState<PositionTypes[]>([])

  // Objectives
  const [selectedObjectives, setSelectedObjectives] = useState<
    IpcrfObjectiveTypes[]
  >(editData?.objectives?.length ? editData.objectives : [])
  const [kraId, setKraId] = useState('')
  const [objectivesList, setObjectivesList] = useState<
    KraObjectiveTypes[] | null
  >(null)
  const [objectiveId, setObjectiveId] = useState('')
  const [objectiveWeight, setObjectiveWeight] = useState('')
  const [objectiveCot1, setObjectiveCot1] = useState(false)
  const [objectiveCot2, setObjectiveCot2] = useState(false)
  const [objectiveCot3, setObjectiveCot3] = useState(false)
  const [objectiveCot4, setObjectiveCot4] = useState(false)
  const [objectiveHasEfficiency, setObjectiveHasEfficiency] = useState(false)
  const [objectiveHasTimeliness, setObjectiveHasTimeliness] = useState(false)
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
  const [errorObjMessage, setErrorObjMessage] = useState<string | null>(null)
  const [addObjective, setAddObjective] = useState(false)
  const [editObjective, setEditObjective] = useState(false)
  const [editIndex, setEditIndex] = useState(-1)

  // Competencies
  const [selectedCompetencies, setSelectedCompetencies] = useState(
    editData?.competencies?.length ? editData.competencies : []
  )
  const [competencyId, setCompetencyId] = useState('')
  const [competencyType, setCompetencyType] = useState('')
  const [errorCompMessage, setErrorCompMessage] = useState<string | null>(null)
  const [addCompetency, setAddCompetency] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<IpcrfTemplateTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: IpcrfTemplateTypes) => {
    setSaving(true)

    if (editData) {
      await handleUpdate(formdata)
    } else {
      await handleCreate(formdata)
    }
    setSaving(false)
  }

  const handleCreate = async (formdata: IpcrfTemplateTypes) => {
    if (selectedItems.length === 0) {
      setErrorMessage('Please choose position/s')
      return
    }
    if (selectedObjectives.length === 0) {
      setErrorObjMessage('Objectives are required')
      return
    }

    const newData = {
      title: formdata.title,
      positions: selectedItems,
      objectives: selectedObjectives,
      competencies: selectedCompetencies,
      is_archive: false,
      is_published: false
    }

    const { data, error } = await supabase
      .from('ipcrf_templates')
      .insert(newData)
      .select()

    if (!error) {
      // Append new data in redux
      const updatedData = {
        ...newData,
        id: data[0].id
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

      // hide the modal
      hideModal()

      // reset all form fields
      reset()
    } else {
      console.error(error)
    }
  }

  const handleUpdate = async (formdata: IpcrfTemplateTypes) => {
    if (!editData) return

    const newData = {
      title: formdata.title,
      positions: selectedItems,
      objectives: selectedObjectives,
      competencies: selectedCompetencies,
      is_archive: false,
      is_published: false
    }

    const { error } = await supabase
      .from('ipcrf_templates')
      .update(newData)
      .eq('id', editData.id)

    if (!error) {
      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        ...newData,
        id: editData.id
      }
      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateList(items))

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
   * Positions
   */
  const handleSearchPosition = async (search: string) => {
    setSearchPosition(search)
    setErrorMessage(null)

    if (search.trim().length < 3) {
      setSearchResults(null)
      return
    }

    const searchText = search.toLowerCase()

    const res = positions.filter((obj) => {
      // Exclude already selected
      const s = selectedItems.filter((item) => item.id === obj.id)
      if (s.length > 0) return false

      return obj.name.toLowerCase().includes(searchText)
    })

    res.length > 0 ? setSearchResults(res) : setSearchResults(null)
  }
  const handleSelected = (item: PositionTypes, multiple = false) => {
    if (multiple) {
      setSelectedItems([...selectedItems, item])
    } else {
      setSelectedItems([item])
    }

    setSearchResults(null)
    setSearchPosition('')
  }
  const handleRemoveSelected = (id: string) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.filter((item) => item.id !== id)
    )
  }

  const setDefaultSelectedPositions = (editData: IpcrfTemplateTypes) => {
    if (!editData) return []

    const pos = positions.filter((obj) => {
      const findId = editData.positions.filter((item) => item.id === obj.id)
      return findId.length > 0
    })
    setSelectedItems(pos)
  }
  /*
   * End - Positions
   */

  /*
   * Objectives
   */
  const handleKraChange = (id: string) => {
    const obj = objectives?.filter((item) => item.kra_id.toString() === id)
    setObjectivesList(obj)
    setKraId(id)
  }

  const handleSelectedObjective = () => {
    const find = selectedObjectives.filter((obj, index) => {
      if (editIndex === index) {
        // exclude if on edit mode
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
      if (editIndex !== index) {
        // exclude if on edit mode
        return partialSum + Number(obj.weight)
      }
      return partialSum
    }, 0)

    if (weightSum + Number(objectiveWeight) > 100) {
      setErrorObjMessage('Total objectives weight must not exceed 100')
      return
    }

    const items = {
      id: objectiveId,
      kra_id: kraId,
      title: getObjectiveTitle(objectiveId),
      weight: objectiveWeight,
      cot_1: objectiveCot1,
      cot_2: objectiveCot2,
      cot_3: objectiveCot3,
      cot_4: objectiveCot4,
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
    // if (editObjective) {
    //   const replacedSelectedObjectives = [
    //     ...selectedObjectives.slice(0, editIndex), // Copy the elements before the replaced object
    //     items, // Add the replaced object
    //     ...selectedObjectives.slice(editIndex + 1) // Copy the elements after the replaced object
    //   ]
    //   setSelectedObjectives(replacedSelectedObjectives)
    // } else {
    //   setSelectedObjectives([...selectedObjectives, items])
    // }

    // If edit mode
    if (editObjective && editIndex !== -1) {
      setSelectedObjectives((prev) => [
        ...prev.slice(0, editIndex), // Keep elements before the edited one
        items, // Replace the edited item
        ...prev.slice(editIndex + 1) // Keep elements after the edited one
      ])
    } else {
      setSelectedObjectives((prev) => [...prev, items]) // Append new item
    }

    setEditIndex(-1)
    setAddObjective(false)
    setEditObjective(false)
    setErrorObjMessage(null)
    handleResetAddObjective()
  }

  const handleRemoveSelectedObjective = (id: string) => {
    setSelectedObjectives((prevSelectedObjectives) =>
      prevSelectedObjectives.filter((item) => item.id !== id)
    )
  }

  const handleAddObjective = () => {
    setAddObjective(true)
    setEditObjective(false)
    setObjectivesList(null)
  }

  const handleEditSelectedObjective = (
    item: IpcrfObjectiveTypes,
    index: number
  ) => {
    handleKraChange(item.kra_id) // Get objectives by KRA ID

    setErrorObjMessage(null)
    setEditObjective(true)
    setAddObjective(false)
    setEditIndex(index)
    setKraId(item.kra_id)
    setObjectiveId(item.id)
    setObjectiveWeight(item.weight)
    setObjectiveCot1(item.cot_1)
    setObjectiveCot2(item.cot_2)
    setObjectiveCot3(item.cot_3)
    setObjectiveCot4(item.cot_4)
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

  const getObjectiveTitle = (id: string) => {
    const obj = objectives.filter((item) => item.id.toString() === id)
    return obj[0].title.length > 100
      ? obj[0].title.slice(0, 100) + '...'
      : obj[0].title
  }

  const handleResetAddObjective = () => {
    setErrorObjMessage(null)
    setAddObjective(false)
    setEditObjective(false)
    setKraId('')
    setObjectiveId('')
    setObjectiveWeight('')
    setObjectiveCot1(false)
    setObjectiveCot2(false)
    setObjectiveCot3(false)
    setObjectiveCot4(false)
    setObjectiveHasEfficiency(false)
    setObjectiveHasTimeliness(false)
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

  /*
   * Competencies
   */
  const handleSelectedCompetency = () => {
    const find = selectedCompetencies.filter(
      (obj) => obj.id.toString() === competencyId
    )
    if (find.length > 0) {
      setErrorCompMessage('This competency is already added')
      return
    }
    if (competencyId.trim() === '') {
      setErrorCompMessage('Competency is required')
      return
    }

    const selectedComp = competencies.find(
      (c) => c.id.toString() === competencyId
    )
    if (!selectedComp) return

    console.log('selectedComp', selectedComp)

    setSelectedCompetencies([...selectedCompetencies, selectedComp])
    setAddCompetency(false)
    setErrorCompMessage(null)
    handleResetAddCompetency()
  }

  const handleRemoveSelectedCompetency = (id: string) => {
    setSelectedCompetencies((prevSelectedCompetencie) =>
      prevSelectedCompetencie.filter((item) => item.id.toString() !== id)
    )
  }

  const handleResetAddCompetency = () => {
    setErrorCompMessage(null)
    setAddCompetency(false)
    setCompetencyId('')
  }
  /*
   * End - Competencies
   */

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    if (editData) {
      setDefaultSelectedPositions(editData)
    }

    reset({
      title: editData ? editData.title : ''
    })
  }, [editData, reset])

  return (
    <div className="z-50 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="sm:h-[calc(100%-3rem)] w-5/6 my-6 mx-auto relative pointer-events-none">
        <div className="max-h-full border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
          <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
            <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
              IPCRF Template Details
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
            className="modal-body relative p-4 overflow-x-scroll"
          >
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  IPCRF Template Title:
                </div>
                <div>
                  {!viewMode ? (
                    <>
                      <input
                        {...register('title', { required: true })}
                        type="text"
                        className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                      />
                      {errors.title && (
                        <div className="mt-1 text-xs text-red-600 font-bold">
                          IPCRF Template Title is required
                        </div>
                      )}
                    </>
                  ) : (
                    <span>{editData?.title}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  This template is applicable to the following positions:
                </div>
                {!viewMode ? (
                  <>
                    <div className="bg-white p-1 border border-gray-300 rounded-sm">
                      {selectedItems.length > 0 &&
                        selectedItems.map((item) => (
                          <div key={uuid()} className="mb-1 inline-flex px-1">
                            <span className="inline-flex items-center text-sm  border border-gray-400 rounded-sm px-1 bg-gray-300">
                              {item.name}
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
                          placeholder="Search Position"
                          value={searchPosition}
                          onChange={(e) => handleSearchPosition(e.target.value)}
                          className="w-full text-sm py-1 px-2 text-gray-600 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                        />

                        {searchResults && (
                          <div className="absolute top-7 left-0 z-50 w-full bg-gray-200 border">
                            {searchResults.map((item) => (
                              <div
                                key={uuid()}
                                onClick={() => handleSelected(item, true)}
                                className="p-1 w-full text-gray-700 cursor-pointer hover:bg-gray-300 text-sm"
                              >
                                {item.name}
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
                  </>
                ) : (
                  <>
                    {selectedItems.length > 0 &&
                      selectedItems.map((item) => (
                        <div key={uuid()} className="mb-1 inline-flex px-1">
                          <span className="inline-flex items-center text-sm  border border-gray-400 rounded-sm px-1 bg-gray-300">
                            {item.name}
                          </span>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-10 mb-4 border p-2">
              <div className="text-gray-600 font-medium dark:text-gray-300">
                FUNCTIONAL COMPETENCY OBJECTIVES:
              </div>
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
                  {selectedObjectives?.map((item, index) => (
                    <tr
                      key={uuid()}
                      className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-2 py-2 flex space-x-3">
                        {!viewMode && (
                          <div className="flex space-x-2">
                            <TrashIcon
                              onClick={() =>
                                handleRemoveSelectedObjective(item.id)
                              }
                              className="w-4 h-4 cursor-pointer"
                            />
                            <PencilSquareIcon
                              onClick={() =>
                                handleEditSelectedObjective(item, index)
                              }
                              className="w-4 h-4 cursor-pointer"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2">{item.title}</td>
                      <td>{item.weight}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {item.cot_1 && (
                            <span className="flex items-center space-x-1 text-green-600 font-medium">
                              <CheckIcon className="w-4 h-4" />
                              COT1
                            </span>
                          )}
                          {item.cot_2 && (
                            <span className="flex items-center space-x-1 text-green-600 font-medium">
                              <CheckIcon className="w-4 h-4" />
                              COT2
                            </span>
                          )}
                          {item.cot_3 && (
                            <span className="flex items-center space-x-1 text-green-600 font-medium">
                              <CheckIcon className="w-4 h-4" />
                              COT3
                            </span>
                          )}
                          {item.cot_4 && (
                            <span className="flex items-center space-x-1 text-green-600 font-medium">
                              <CheckIcon className="w-4 h-4" />
                              COT4
                            </span>
                          )}
                          {item.has_efficiency && (
                            <span className="flex items-center space-x-2 text-green-600 font-medium">
                              <CheckIcon className="w-4 h-4" />
                              Efficiency
                            </span>
                          )}
                          {item.has_timeliness && (
                            <span className="flex items-center space-x-2 text-green-600 font-medium">
                              <CheckIcon className="w-4 h-4" />
                              Timeliness
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 text-xs dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-2 py-4" colSpan={4}>
                      <span className="font-medium">
                        Total Weight:{' '}
                        {selectedObjectives?.reduce(
                          (partialSum, obj) => partialSum + Number(obj.weight),
                          0
                        )}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {errorObjMessage && (
                <div className="flex items-center justify-center space-x-2 bg-gray-50 text-xs">
                  {errorObjMessage && (
                    <div className="mt-1 text-xs text-red-600 font-bold">
                      {errorObjMessage}
                    </div>
                  )}
                </div>
              )}
              {!addObjective && !editObjective && !viewMode && (
                <div className="flex items-center justify-center space-x-2 bg-gray-50 text-xs">
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-xs text-white rounded-sm"
                  >
                    Add Objective
                  </button>
                </div>
              )}
              {(addObjective || editObjective) && (
                <div className="p-2 border-2 border-gray-400 border-dashed">
                  <div className="p-4 space-y-2 bg-gray-200 text-xs">
                    <table className="w-full mx-2 text-sm text-left text-gray-600 dark:text-gray-400">
                      <tbody>
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="font-bold py-2 w-20">KRA</td>
                          <td className="">
                            <select
                              value={kraId}
                              onChange={(e) => handleKraChange(e.target.value)}
                              className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                            >
                              <option key={uuid()} value="">
                                Choose KRA
                              </option>
                              {kras?.map((item) => (
                                <option key={uuid()} value={item.id}>
                                  {item.title.slice(0, 100)}{' '}
                                  {item.title.length > 100 && '...'}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        {((objectivesList && objectivesList.length > 0) ||
                          editObjective) && (
                          <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                            <td className="font-bold py-2">Objective</td>
                            <td className="">
                              <select
                                value={objectiveId}
                                onChange={(e) => setObjectiveId(e.target.value)}
                                className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                              >
                                <option key={uuid()} value="">
                                  Choose Objective
                                </option>
                                {objectivesList?.map((item) => (
                                  <option key={uuid()} value={item.id}>
                                    {item.title.slice(0, 100)}{' '}
                                    {item.title.length > 100 && '...'}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )}
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="font-bold py-2">Weight</td>
                          <td className="">
                            <input
                              type="number"
                              value={objectiveWeight}
                              onChange={(e) =>
                                setObjectiveWeight(e.target.value)
                              }
                              step="any"
                              className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
                            />
                          </td>
                        </tr>
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="font-bold py-2">Ratings</td>
                          <td className="">
                            <div className="flex items-start justify-start space-x-3">
                              <div>
                                <input
                                  checked={objectiveCot1}
                                  onChange={() =>
                                    setObjectiveCot1(!objectiveCot1)
                                  }
                                  id="cot_1"
                                  type="checkbox"
                                />

                                <label htmlFor="cot_1" className="px-1">
                                  COT 1
                                </label>
                              </div>
                              <div>
                                <input
                                  checked={objectiveCot2}
                                  onChange={() =>
                                    setObjectiveCot2(!objectiveCot2)
                                  }
                                  id="cot_2"
                                  type="checkbox"
                                />
                                <label htmlFor="cot_2" className="px-1">
                                  COT 2
                                </label>
                              </div>
                              <div>
                                <input
                                  checked={objectiveCot3}
                                  onChange={() =>
                                    setObjectiveCot3(!objectiveCot3)
                                  }
                                  id="cot_3"
                                  type="checkbox"
                                />
                                <label htmlFor="cot_3" className="px-1">
                                  COT 3
                                </label>
                              </div>
                              <div>
                                <input
                                  checked={objectiveCot4}
                                  onChange={() =>
                                    setObjectiveCot4(!objectiveCot4)
                                  }
                                  id="cot_4"
                                  type="checkbox"
                                />
                                <label htmlFor="cot_4" className="px-1">
                                  COT 4
                                </label>
                              </div>
                              <div className="flex">
                                <input
                                  checked={objectiveHasEfficiency}
                                  onChange={() =>
                                    setObjectiveHasEfficiency(
                                      !objectiveHasEfficiency
                                    )
                                  }
                                  id="has_efficiency"
                                  type="checkbox"
                                />
                                <label
                                  htmlFor="has_efficiency"
                                  className="px-1"
                                >
                                  Has&nbsp;Efficiency
                                </label>
                              </div>
                              <div className="flex">
                                <input
                                  checked={objectiveHasTimeliness}
                                  onChange={() =>
                                    setObjectiveHasTimeliness(
                                      !objectiveHasTimeliness
                                    )
                                  }
                                  id="has_timeliness"
                                  type="checkbox"
                                />
                                <label
                                  htmlFor="has_timeliness"
                                  className="px-1"
                                >
                                  Has&nbsp;Timeliness
                                </label>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="font-light text-lg text-gray-600 text-center py-4">
                      Performance Indicators
                    </div>
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
                          <td className="py-2 font-bold">Quality</td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setQPE1(e.target.value)}
                              value={qPE1}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setQPE2(e.target.value)}
                              value={qPE2}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setQPE3(e.target.value)}
                              value={qPE3}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setQPE4(e.target.value)}
                              value={qPE4}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setQPE5(e.target.value)}
                              value={qPE5}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                        </tr>
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="py-2 font-bold">Efficiency</td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setEPE1(e.target.value)}
                              value={ePE1}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setEPE2(e.target.value)}
                              value={ePE2}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setEPE3(e.target.value)}
                              value={ePE3}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setEPE4(e.target.value)}
                              value={ePE4}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setEPE5(e.target.value)}
                              value={ePE5}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                        </tr>
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="py-2 font-bold">Timeliness</td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setTPE1(e.target.value)}
                              value={tPE1}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setTPE2(e.target.value)}
                              value={tPE2}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setTPE3(e.target.value)}
                              value={tPE3}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setTPE4(e.target.value)}
                              value={tPE4}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                          <td className="py-2">
                            <textarea
                              onChange={(e) => setTPE5(e.target.value)}
                              value={tPE5}
                              className="focus:outline-none ring-0 p-1"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <button
                        type="button"
                        onClick={handleSelectedObjective}
                        className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                      >
                        {addObjective ? 'Add' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAddObjective}
                        className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 mt-10 mb-4 border p-2">
              <div className="text-gray-600 font-medium dark:text-gray-300">
                CORE BEHAVIORAL COMPETENCIES:
              </div>
              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                <thead className="text-xs border-b uppercase bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="py-2 px-2"></th>
                    <th className="py-2 px-2">Competency</th>
                    <th className="py-2 px-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompetencies?.map((item) => (
                    <tr
                      key={uuid()}
                      className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-2 py-2">
                        {!viewMode && (
                          <TrashIcon
                            onClick={(e) =>
                              handleRemoveSelectedCompetency(item.id)
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-2 py-2">{item.title}</td>
                      <td className="px-2 py-2">
                        {item.competency_items?.map((item, index) => (
                          <div key={uuid()}>
                            {index + 1}. {item.title}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {errorCompMessage && (
                <div className="flex items-center justify-center space-x-2 bg-gray-50 text-xs">
                  {errorCompMessage && (
                    <div className="mt-1 text-xs text-red-600 font-bold">
                      {errorCompMessage}
                    </div>
                  )}
                </div>
              )}
              {!addCompetency && !viewMode && (
                <div className="flex items-center justify-center space-x-2 bg-gray-50 text-xs">
                  <button
                    type="button"
                    onClick={(e) => setAddCompetency(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-xs text-white rounded-sm"
                  >
                    Add Competency
                  </button>
                </div>
              )}
              {addCompetency && (
                <div className="p-2 border-2 border-gray-400 border-dashed">
                  <div className="p-4 flex-col space-y-2 bg-gray-200 text-xs">
                    <table className="w-full mx-2 text-sm text-left text-gray-600 dark:text-gray-400">
                      <tbody>
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="font-bold py-2 w-32">Type</td>
                          <td className="">
                            <select
                              value={competencyType}
                              onChange={(e) =>
                                setCompetencyType(e.target.value)
                              }
                              className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                            >
                              <option key={uuid()} value="">
                                Choose Type
                              </option>
                              <option value="Core Behavioural">
                                Core Behavioural
                              </option>
                              <option value="Leadership">Leadership</option>
                            </select>
                          </td>
                        </tr>
                        <tr className="text-xs dark:bg-gray-800 dark:border-gray-700">
                          <td className="font-bold py-2 w-32">Compentency</td>
                          <td className="">
                            <select
                              value={competencyId}
                              onChange={(e) => setCompetencyId(e.target.value)}
                              className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                            >
                              <option key={uuid()} value="">
                                Choose Competency
                              </option>
                              {competencies
                                .filter((c) => c.type === competencyType)
                                .map((item) => (
                                  <option key={uuid()} value={item.id}>
                                    {item.title.slice(0, 100)}{' '}
                                    {item.title.length > 100 && '...'}
                                  </option>
                                ))}
                            </select>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectedCompetency}
                        className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAddCompetency}
                        className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!addObjective && !addCompetency && !editObjective && (
              <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
                {!viewMode && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                  >
                    {saving ? 'Saving..' : 'Save Settings'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={hideModal}
                  disabled={saving}
                  className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                >
                  Close
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
