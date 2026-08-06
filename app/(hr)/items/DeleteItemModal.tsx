'use client'

import { CustomButton, UserBlock } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { useState } from 'react'

// Types
import type { ItemTypes } from '@/types'

// Redux imports
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  item: ItemTypes
}

// Deleting an item is permanent and only available to super admins. The
// generic DeleteModal is not used here because the holder's hrm_users.item_id
// has to be cleared first, otherwise the employee keeps pointing at a row
// that no longer exists.
const DeleteItemModal = ({ hideModal, item }: ModalProps) => {
  const { setToast } = useFilter()
  const { supabase } = useSupabase()
  const [deleting, setDeleting] = useState(false)

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const resultsCounter = useSelector((state: any) => state.results.value)
  const dispatch = useDispatch()

  const handleDelete = async () => {
    if (deleting) return

    setDeleting(true)

    try {
      // Detach the item holder before the row disappears
      if (item.hrm_user) {
        const { error: error2 } = await supabase
          .from('hrm_users')
          .update({ item_id: null })
          .eq('id', item.hrm_user.id)

        if (error2) {
          void logError(
            'Delete Plantilla - clear user item_id',
            'hrm_users',
            JSON.stringify({ item_id: item.id, user_id: item.hrm_user.id }),
            error2.message
          )
          setToast('error', 'Delete failed, please try again.')
          throw new Error(error2.message)
        }
      }

      const { error } = await supabase
        .from('hrm_items')
        .delete()
        .eq('id', item.id)

      if (error) {
        void logError(
          'Delete Plantilla',
          'hrm_items',
          JSON.stringify({ item_id: item.id }),
          error.message
        )
        setToast(
          'error',
          'Delete failed. This item may still be referenced by other records.'
        )
        throw new Error(error.message)
      }

      // Remove data in redux
      const items = [...globallist]
      dispatch(updateList(items.filter((i) => i.id !== item.id)))

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) - 1,
          results: Number(resultsCounter.results) - 1
        })
      )

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      // hide the modal
      hideModal()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">Delete Plantilla Item</h5>
            <button
              disabled={deleting}
              onClick={hideModal}
              type="button"
              className="app__modal_header_btn"
            >
              &times;
            </button>
          </div>

          <div className="app__modal_body">
            <div className="text-gray-700 text-sm py-4 space-y-3">
              <div>
                Are you sure you want to permanently delete item{' '}
                <span className="font-bold">{item.item_number}</span>
                {item.hrm_position?.name && <> ({item.hrm_position.name})</>}?
                This cannot be undone.
              </div>
              {item.hrm_user && (
                <div className="p-3 border border-orange-300 bg-orange-50 rounded-sm space-y-2">
                  <div className="font-medium">
                    This item is currently held by:
                  </div>
                  <UserBlock user={item.hrm_user} />
                  <div>
                    The employee will be unassigned from this plantilla item.
                  </div>
                </div>
              )}
            </div>
            <div className="app__modal_footer">
              <CustomButton
                handleClick={handleDelete}
                btnType="button"
                isDisabled={deleting}
                title={deleting ? 'Deleting...' : 'Delete'}
                containerStyles="app__btn_green_sm"
              />
              <CustomButton
                handleClick={hideModal}
                btnType="button"
                isDisabled={deleting}
                title="Cancel"
                containerStyles="app__btn_gray_sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteItemModal
