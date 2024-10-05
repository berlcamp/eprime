'use client'

import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import axios from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Title from '../Title'

interface UpdatePasswordTypes {
  newPassword: string
  confirmPassword: string
}
export default function LoginSettings({ userId }: { userId: string }) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdatePasswordTypes>()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { setToast } = useFilter()
  const { supabase, session } = useSupabase()

  const handlePasswordChange = async (data: {
    newPassword: string
    confirmPassword: string
  }) => {
    if (loading) return

    setLoading(true)
    setMessage('')

    if (data.newPassword !== data.confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    if (userId === session.user.id) {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })
      if (error) {
        console.error(error)
        setMessage(`Error: ${error.message}`)
      } else {
        setToast('success', 'Password successfully changed')
        setMessage('Password updated successfully')
        reset({
          newPassword: '',
          confirmPassword: ''
        })
      }
    } else {
      axios
        .post('/api/updatepass', {
          user_id: userId,
          new_password: data.newPassword
        })
        .then(function (response) {
          setToast('success', 'Password successfully changed')
          setMessage('Password updated successfully')
          reset({
            newPassword: '',
            confirmPassword: ''
          })
        })
        .catch(function (error) {
          console.error(error)
          setMessage(`Error: ${error.message}`)
        })
    }

    setLoading(false)
  }

  return (
    <>
      <div>
        <div className="app__title">
          <Title title="Change Password" />
        </div>

        {/* Main Content */}
        <div className="w-2/3 md:w-1/2 mx-4 mt-4">
          <form onSubmit={handleSubmit(handlePasswordChange)}>
            <div className="mb-4">
              <label className="app__label_standard">New Password</label>
              <input
                type="password"
                className="app__input_standard"
                {...register('newPassword', {
                  required: 'New password is required'
                })}
              />
              {errors.newPassword && (
                <p className="text-red-500 text-xs">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="app__label_standard">
                Confirm New Password
              </label>
              <input
                type="password"
                className="app__input_standard"
                {...register('confirmPassword', {
                  required: 'Please confirm your password'
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {message && message === 'Password updated successfully' && (
              <p className="text-sm mt-2 text-green-500">{message}</p>
            )}
            {message && message !== 'Password updated successfully' && (
              <p className="text-sm mt-2 text-red-500">{message}</p>
            )}

            <button
              type="submit"
              className="app__btn_green mt-4"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
