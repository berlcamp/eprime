'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { CompetencyTypes } from '@/types/pmsTypes'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: CompetencyTypes | null
}

export default function AddEditModal({ editData, hideModal }: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<CompetencyTypes>({
    mode: 'onSubmit',
    defaultValues: {
      title: editData ? editData.title : '',
      type: editData ? editData.type : '',
      item_1: editData ? editData.competency_items[0].title : '',
      item_2: editData ? editData.competency_items[1].title : '',
      item_3: editData ? editData.competency_items[2].title : '',
      item_4: editData ? editData.competency_items[3].title : '',
      item_5: editData ? editData.competency_items[4].title : ''
    }
  })

  const onSubmit = async (formdata: CompetencyTypes) => {
    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: CompetencyTypes) => {
    const competencyData = {
      title: formdata.title,
      type: formdata.type
    }

    const { data, error } = await supabase
      .from('competencies')
      .insert(competencyData)
      .select()

    if (error) console.error(error)

    // Add items to competency_items table
    const itemsData = [
      { competency_id: data[0].id, title: formdata.item_1 },
      { competency_id: data[0].id, title: formdata.item_2 },
      { competency_id: data[0].id, title: formdata.item_3 },
      { competency_id: data[0].id, title: formdata.item_4 },
      { competency_id: data[0].id, title: formdata.item_5 }
    ]

    const { error: itemsError } = await supabase
      .from('competency_items')
      .insert(itemsData)
      .select()

    if (itemsError) console.error(itemsError)

    const newData = {
      title: formdata.title,
      type: formdata.type,
      competency_items: itemsData
    }

    // Append new data in redux
    const updatedData = {
      ...newData,
      competency_items: itemsData,
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

    // hide the modal
    hideModal()

    // reset all form fields
    reset()
  }

  const handleUpdate = async (formdata: CompetencyTypes) => {
    if (!editData) return

    const newData = {
      title: formdata.title,
      type: formdata.type
    }

    const { error } = await supabase
      .from('competencies')
      .update(newData)
      .eq('id', editData.id)

    if (error) console.error(error)

    // Delete existing items first and replace with new data
    const { error: deleteError } = await supabase
      .from('competency_items')
      .delete()
      .eq('competency_id', editData.id)

    if (deleteError) console.error(deleteError)

    // Add items to competency_items table
    const itemsData = [
      { competency_id: editData.id, title: formdata.item_1 },
      { competency_id: editData.id, title: formdata.item_2 },
      { competency_id: editData.id, title: formdata.item_3 },
      { competency_id: editData.id, title: formdata.item_4 },
      { competency_id: editData.id, title: formdata.item_5 }
    ]

    const { error: itemsError } = await supabase
      .from('competency_items')
      .insert(itemsData)
      .select()

    if (itemsError) console.error(itemsError)

    // Update data in redux
    const items = [...globallist]
    const updatedData = {
      ...newData,
      competency_items: itemsData,
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
  }

  return (
    <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="sm:h-[calc(100%-3rem)] max-w-lg my-6 mx-auto relative w-auto pointer-events-none">
        <div className="max-h-full overflow-hidden border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current dark:bg-gray-600">
          <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
            <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
              Competency Details
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
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  Type:
                </div>
                <div>
                  <select
                    {...register('type', { required: true })}
                    className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="Core Behavioural">Core Behavioural</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                  {errors.type && (
                    <div className="mt-1 text-xs text-red-600 font-bold">
                      Type is required
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  Compentency Name:
                </div>
                <div>
                  <input
                    {...register('title', { required: true })}
                    type="text"
                    placeholder="Example: Self-Management"
                    className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                  />
                  {errors.title && (
                    <div className="mt-1 text-xs text-red-600 font-bold">
                      Compentency Name is required
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  Items:
                </div>
                <div className="pl-12 flex flex-col space-y-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <span>1. </span>
                    <input
                      {...register('item_1', { required: true })}
                      type="text"
                      className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                    />
                  </div>
                  {errors.item_1 && (
                    <div className="text-xs pl-4 pb-4 text-red-600 font-bold">
                      This is required
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span>2. </span>
                    <input
                      {...register('item_2', { required: true })}
                      type="text"
                      className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                    />
                  </div>
                  {errors.item_2 && (
                    <div className="text-xs pl-4 pb-4 text-red-600 font-bold">
                      This is required
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span>3. </span>
                    <input
                      {...register('item_3', { required: true })}
                      type="text"
                      className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                    />
                  </div>
                  {errors.item_3 && (
                    <div className="text-xs pl-4 pb-4 text-red-600 font-bold">
                      This is required
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span>4. </span>
                    <input
                      {...register('item_4', { required: true })}
                      type="text"
                      className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                    />
                  </div>
                  {errors.item_4 && (
                    <div className="text-xs pl-4 pb-4 text-red-600 font-bold">
                      This is required
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span>5. </span>
                    <input
                      {...register('item_5', { required: true })}
                      type="text"
                      className="w-full text-sm py-1 px-2 text-gray-600 border border-gray-300 rounded-sm focus:ring-0 focus:outline-none dark:bg-gray-900 dark:text-gray-300"
                    />
                  </div>
                  {errors.item_5 && (
                    <div className="text-xs pl-4 pb-4 text-red-600 font-bold">
                      This is required
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
              <button
                type="submit"
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
