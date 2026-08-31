/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import TwoColTableLoading from '@/components/Loading/TwoColTableLoading'
import {
  ConfirmModal,
  CustomButton,
  TableError,
  UserBlock
} from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { StickiesTypes } from '@/types'
import {
  runListQuery,
  runQuery,
  type QueryError
} from '@/utils/query-result'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useEffect, useRef, useState } from 'react'

interface ModalProps {
  hideModal: () => void
}

export default function StickiesModal({ hideModal }: ModalProps) {
  const [selectedId, setSelectedId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [list, setList] = useState<StickiesTypes[] | []>([])
  const [error, setError] = useState<QueryError | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)

  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const handleNoteChange = async (value: string, id: string, index: number) => {
    const { error } = await supabase
      .from('hrm_request_tracker_stickies')
      .update({
        note: value
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      return
    }

    const newData = [...list]
    newData[index].note = value
    setList(newData)
  }

  const handleDelete = (id: string) => {
    setShowConfirmation(true)
    setSelectedId(id)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedId('')
  }
  const handleConfirm = async () => {
    await handleDeleteReply()
    setShowConfirmation(false)
  }
  const handleDeleteReply = async () => {
    const result = await runQuery(
      {
        transaction: 'Delete sticky',
        table: 'hrm_request_tracker_stickies',
        payload: { id: selectedId }
      },
      supabase
        .from('hrm_request_tracker_stickies')
        .delete()
        .eq('id', selectedId)
    )

    // The row used to disappear from the list whether or not the delete
    // actually happened, and a failure said nothing.
    if (!result.ok) {
      setToast('error', `Could not delete this sticky. ${result.error.message}`)
      return
    }

    setList((prevList) => prevList.filter((item) => item.id !== selectedId))

    setToast('success', 'Successfully Deleted!')
  }

  const fetchData = async () => {
    const result = await runListQuery<StickiesTypes>(
      {
        transaction: 'Fetch stickies',
        table: 'hrm_request_tracker_stickies',
        payload: { userId: session?.user.id }
      },
      supabase
        .from('hrm_request_tracker_stickies')
        .select(
          '*, tracker:tracker_id(id, reference_code, type, creator:created_by(firstname,middlename,lastname,avatar_url))'
        )
        .eq('user_id', session?.user.id)
        .order('id', { ascending: true })
    )

    // An empty list and a failed fetch both used to render as "no stickies".
    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setList(result.data)
  }

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hideModal()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef])

  return (
    <>
      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="text-md font-bold leading-normal text-gray-800 dark:text-gray-300">
                Stickies
              </h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="modal-body relative p-4 overflow-x-scroll">
              <div className="items-center mx-4">
                {!list && <TwoColTableLoading />}
                {error && <TableError error={error} onRetry={fetchData} />}
                {!error && list?.length === 0 && (
                  <div>
                    <h3 className="text-sm text-gray-700">
                      No items added to stickies yet.
                    </h3>
                  </div>
                )}
                {list?.map((item, index) => (
                  <div
                    key={index}
                    style={{ backgroundColor: `${item.color}` }}
                    className="relative max-w-xs mr-4 mb-4 shadow-lg inline-flex flex-col rounded-sm p-2 text-xs"
                  >
                    <XMarkIcon
                      onClick={() => handleDelete(item.id)}
                      className="w-5 h-5 cursor-pointer text-gray-700 absolute z-30 top-1 right-1"
                    />
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      <div className="w-full">
                        <span>Reference Code: </span>
                        <span className="text-green-900">
                          <span className="font-bold">
                            {item.tracker.reference_code}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      <div className="w-full">
                        <span>Type: </span>
                        <span className="font-bold">{item.tracker.type}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      <div className="w-full">
                        <span>Requester: </span>
                        <span className="font-bold">
                          <UserBlock user={item.tracker.creator} />
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-1 mb-4">
                      <div className="w-full">
                        <span>Note: </span>
                      </div>
                      <textarea
                        defaultValue={item.note}
                        onBlur={(e) =>
                          handleNoteChange(e.target.value, item.id, index)
                        }
                        className="w-full text-sm py-1 px-2 text-gray-600 resize-none rounded-sm focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
                {/* Confirm Delete Modal */}
                {showConfirmation && (
                  <ConfirmModal
                    btnText="Yes"
                    header="Delete Sticky"
                    message="Are you sure you want to delete this Sticky?"
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
