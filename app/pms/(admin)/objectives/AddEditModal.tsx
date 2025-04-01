import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { KraObjectiveTypes } from '@/types/pmsTypes'
import { logError } from '@/utils/fetchApi'
import { fetchKras } from '@/utils/pmsApi'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  editData: KraObjectiveTypes | null
}

const AddEditModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [saving, setSaving] = useState(false)

  const [kras, setKras] = useState<KraObjectiveTypes[]>([])

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<KraObjectiveTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: KraObjectiveTypes) => {
    if (saving) return

    setSaving(true)

    if (editData) {
      void handleUpdate(formdata)
    } else {
      void handleCreate(formdata)
    }
  }

  const handleCreate = async (formdata: KraObjectiveTypes) => {
    const newData = {
      title: formdata.title,
      kra_id: formdata.kra_id
    }

    let newId

    try {
      const { data, error } = await supabase
        .from('kra_objectives')
        .insert(newData)
        .select()

      if (error) {
        void logError(
          'Create KRA Objectives',
          'kra_objectives',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      newId = data[0].id // newly created ID

      // Append new data in redux
      const updatedData = {
        ...newData,
        id: newId
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

  const handleUpdate = async (formdata: KraObjectiveTypes) => {
    if (!editData) return

    const newData = {
      title: formdata.title,
      kra_id: formdata.kra_id
    }

    try {
      const { error } = await supabase
        .from('kra_objectives')
        .update(newData)
        .eq('id', editData.id)

      if (error) {
        void logError(
          'Update KRA Objectives',
          'kra_objectives',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the `page and try again.'
        )
        throw new Error(error.message)
      }

      // Update data in redux
      const items = [...globallist]
      const updatedData = {
        ...newData,
        kra: kras.find((k) => k.id.toString() === formdata.kra_id),
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

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      title: editData ? editData.title : '',
      kra_id: editData ? editData.kra_id : ''
    })
  }, [kras, editData, reset])

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    const fetchKrasData = async () => {
      const result = await fetchKras({}, 999, 0)
      setKras(result.data)
    }
    void fetchKrasData()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">KRA Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Objective Title</div>
                  <div>
                    <input
                      {...register('title', { required: true })}
                      className="app__input_standard"
                    />
                    {errors.title && (
                      <div className="app__error_message">
                        Title is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">KRA</div>
                  <div>
                    <select
                      {...register('kra_id', { required: true })}
                      className="app__input_standard"
                    >
                      <option value="">Select KRA</option>
                      {kras.map((kra) => (
                        <option key={kra.id} value={kra.id}>
                          {kra.title}
                        </option>
                      ))}
                      <option value="">Select KRA</option>
                    </select>
                    {errors.kra_id && (
                      <div className="app__error_message">KRA is required</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? 'Saving...' : 'Save'}
                  containerStyles="app__btn_green"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddEditModal
