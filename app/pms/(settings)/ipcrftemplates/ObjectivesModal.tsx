// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/list2Slice'
import { IpcrfTemplatesTypes } from '@/types/pmsTypes'
import { Dialog } from '@headlessui/react'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ObjectivesList } from './ObjectivesList'

// Always update this on other pages
type ItemType = IpcrfTemplatesTypes

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: ItemType
}

export const ObjectivesModal = ({ editData, onClose, isOpen }: ModalProps) => {
  //
  const dispatch = useDispatch()

  const { supabase } = useSupabase()

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('pms_ipcrf_template_objectives')
        .select('*, objective:objective_id(*)', { count: 'exact' })
        .eq('ipcrf_template_id', editData?.id)

      if (error) {
        console.error('error', error)
      } else {
        // Update the list in Redux store
        dispatch(updateList(data))
      }
    }

    void fetchData()
  }, [dispatch, editData, isOpen])

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-40 focus:outline-none"
      onClose={() => {}}
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />

      {/* Centered panel container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Panel className="app__modal_dialog_panel_lg">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            <Dialog.Title
              as="h3"
              className="text-base font-medium flex justify-between"
            >
              <span className="capitalize">{editData.description}</span>
              <Button type="button" onClick={onClose} variant="outline">
                Close
              </Button>
            </Dialog.Title>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            {/* Pass Redux data to List Table */}
            <ObjectivesList editData={editData} />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
