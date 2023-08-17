'use client'

import React, { useState, Fragment } from 'react'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { CustomButton } from '@/components'

// Redux imports
import { useSelector, useDispatch } from 'react-redux'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { updateResultCounter } from '@/GlobalRedux/Features/resultsCounterSlice'

interface ModalProps {
  hideModal: () => void
  id: string
  table: string
}

const DeleteModal = ({ hideModal, id, table }: ModalProps) => {
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
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw new Error(error.message)
    } catch (e) {
      console.error(e)
    } finally {
      // Update data in redux
      const items = [...globallist]
      const updatedList = items.filter(item => item.id !== id)
      dispatch(updateList(updatedList))

      // Updating showing text in redux
      dispatch(updateResultCounter({ showing: Number(resultsCounter.showing) - 1, results: Number(resultsCounter.results) - 1 }))

      setDeleting(false)

      // pop up the success message
      setToast('success', 'Successfully Deleted!')

      // hide the modal
      hideModal()
    }
  }

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Confirm Delete
              </h5>
              <button disabled={deleting} onClick={hideModal} type="button" className="app__modal_header_btn">&times;</button>
            </div>

            <div className="app__modal_body">
              <div className='text-gray-700 text-sm py-4'>
                Are you sure you want to delete this?
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  handleClick={handleDelete}
                  btnType='button'
                  title={deleting ? 'Deleting...' : 'Delete'}
                  containerStyles="app__btn_green_sm"
                />
                <CustomButton
                  handleClick={hideModal}
                  btnType='button'
                  title='Cancel'
                  containerStyles="app__btn_gray_sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DeleteModal
