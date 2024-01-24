/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client'
import React, { Fragment, useState } from 'react'
import { useSupabase } from '@/context/SupabaseProvider'
import { useSelector, useDispatch } from 'react-redux'
import { updateRemarksList } from '@/GlobalRedux/Features/remarksSlice'
import type { Employee, DocumentTypes, RemarksTypes } from '@/types'

interface ModalProps {
  reply: RemarksTypes
  document: DocumentTypes
}

export default function CommentBox ({ reply, document }: ModalProps) {
  const { supabase, session, systemUsers } = useSupabase()

  const [comment, setComment] = useState('')
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [saving, setSaving] = useState(false)

  const user: Employee = systemUsers.find((u: { id: string }) => u.id === session.user.id)

  // Redux staff
  const globalremarks = useSelector((state: any) => state.remarks.value)
  const dispatch = useDispatch()

  const handleCancel = () => {
    setShowCommentInput(false)
    setComment('')
  }
  const handleSubmitReply = async () => {
    if (saving) return

    if (comment.trim() === '') {
      setComment('')
      return
    }

    setSaving(true)
    //
    try {
      // Insert into reply to database table
      const commentData = {
        remarks_id: reply.id,
        sender_id: session.user.id,
        message: comment
      }
      const { data, error } = await supabase
        .from('hrm_remarks_comments')
        .insert(commentData)
        .select()

      if (error) {
        console.error(error)
        return
      }

      const user: Employee = systemUsers.find((u: { id: string }) => u.id === session.user.id)

      // Update data in remarks redux
      const items = [...globalremarks]
      const updatedData = { hrm_remarks_comments: [...reply.hrm_remarks_comments, { ...commentData, hrm_users: user, created_at: data[0].created_at, id: data[0].id }], id: reply.id }
      const foundIndex = items.findIndex(x => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      dispatch(updateRemarksList(items))

      // Notify followers and departments
      void handleNotify()

      setComment('')
      setShowCommentInput(false)
      setSaving(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotify = async () => {
    //
    try {
      // Send notification to remarks author
      const userIds: string[] = [reply.sender_id]

      const notificationData: any[] = []

      userIds.forEach((userId) => {
        notificationData.push({
          message: `${user.firstname} ${user.middlename} ${user.lastname} added comment to Request ${document.reference_code}.`,
          url: `/tracker/${document.reference_code}`,
          type: 'Remarks',
          user_id: userId,
          reference_id: document.id,
          reference_table: 'hrm_request_trackers'
        })
      })

      if (notificationData.length > 0) {
        // insert to notifications
        const { error: error3 } = await supabase
          .from('hrm_notifications')
          .insert(notificationData)

        if (error3) {
          throw new Error(error3.message)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className='w-full flex-col space-y-2 px-4 my-4 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
      {
        !showCommentInput &&
          <button
            onClick={() => setShowCommentInput(true)}
            className="text-xs mb-2 font-semibold underline text-green-700"
            type="button">
              Reply</button>
      }
      {
        showCommentInput &&
          <>
            <div className='flex space-x-2'>
              <span className='flex-1 font-bold'>Reply:</span>
            </div>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder='Write your reply here..'
              className='w-full border focus:ring-0 focus:outline-none p-1 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300'/>

              <div className='flex items-center space-x-2 justify-start'>
                <button
                  onClick={handleSubmitReply}
                  className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                  type="button"
                  >Submit</button>
                  <button
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 border border-gray-600 font-bold px-2 py-1 text-xs text-white rounded-sm"
                  type="button"
                  >Cancel</button>
              </div>
            </>
        }
    </div>
  )
}
