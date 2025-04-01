'use client'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { IpcrfTemplateTypes } from '@/types/pmsTypes'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  selectedItem: IpcrfTemplateTypes
  hideModal: () => void
}

export default function UnPublishedModal({
  selectedItem,
  hideModal
}: ModalProps) {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [errorMessage, setErrorMessage] = useState('')

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const handleUnpublished = async () => {
    const { count } = await supabase
      .from('ipcrfs')
      .select('*', { count: 'exact' })
      .eq('ipcrf_template_id', selectedItem.id)

    if (count > 0) {
      setErrorMessage(
        'This template is already been used on employees IPCRFs and can no longer be unpublished. You can Archive this instead.'
      )
    } else {
      const { error } = await supabase
        .from('ipcrf_templates')
        .update({ is_published: '' })
        .eq('id', selectedItem.id)

      if (error) {
        setErrorMessage('Something went wrong.')
      } else {
        // Update data in redux
        const items = [...globallist]
        const updatedData = {
          ...selectedItem,
          is_published: true,
          id: selectedItem.id
        }
        const foundIndex = items.findIndex((x) => x.id === updatedData.id)
        items[foundIndex] = { ...items[foundIndex], ...updatedData }
        dispatch(updateList(items))

        // success message
        setToast('success', 'Successfully Unpublished')

        // hide modal
        hideModal()
      }
    }
  }

  return (
    <div className="z-40 fixed top-0 left-0 w-full h-full outline-none overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="sm:h-[calc(100%-3rem)] max-w-lg my-6 mx-auto relative w-auto pointer-events-none">
        <div className="max-h-full overflow-hidden border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-gray-50 bg-clip-padding rounded-sm outline-none text-current">
          <div className="flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
            <h5
              className="text-md font-bold leading-normal text-gray-800"
              id="exampleModalScrollableLabel"
            >
              Unpublish confirmation
            </h5>
            <button
              onClick={hideModal}
              type="button"
              className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
            >
              &times;
            </button>
          </div>
          <div className="modal-body relative p-4">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="w-full">
                {errorMessage ? (
                  <div className="text-red-500 font-medium text-sm mb-1 dark:text-gray-300">
                    Error: {errorMessage}{' '}
                  </div>
                ) : (
                  <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                    Please confirm this.{' '}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2 flex-shrink-0 flex-wrap items-center justify-end pt-4 border-t border-gray-200 rounded-b-md">
              <button
                onClick={handleUnpublished}
                type="button"
                className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
