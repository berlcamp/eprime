'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import type { Employee } from '@/types'
import { useEffect, useRef, useState } from 'react'
import CustomButton from '../CustomButton'
import TwoColTableLoading from '../Loading/TwoColTableLoading'
import LeaveCard from './LeaveCard'

interface ModalProps {
  hideModal: () => void
  userId: string
}

export default function LeaveCardModal ({ hideModal, userId }: ModalProps) {
  const [user, setUser] = useState<Employee | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)

  const { supabase } = useSupabase()

  useEffect(() => {
    // fetch user
    void (async () => {
      const { data } = await supabase
        .from('hrm_users')
        .select()
        .eq('id', userId)
        .limit(1)
        .single()

      if (data) {
        setUser(data)
      }
    })()
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
  }, [wrapperRef])

  return (
      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            {
              !user && <TwoColTableLoading/>
            }
            {
              user &&
                <>
                <div className="app__modal_header">
                  <h5 className="app__modal_header_text flex-1">{user.firstname} {user.middlename} {user.lastname} Leave Card</h5>
                  <CustomButton
                    containerStyles='app__btn_gray'
                    title='Close'
                    btnType='button'
                    handleClick={hideModal}
                    />
                </div>
                <div className="modal-body relative overflow-x-scroll">
                  <LeaveCard userId={userId} />
                </div>
                </>
            }
          </div>
        </div>
      </div>
  )
}
