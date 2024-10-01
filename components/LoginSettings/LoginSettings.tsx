'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Title from '../Title'

interface UpdatePasswordTypes {
  newPassword: string
  confirmPassword: string
}
export default function LoginSettings() {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdatePasswordTypes>()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { supabase } = useSupabase()

  const handlePasswordChange = async (data: {
    newPassword: string
    confirmPassword: string
  }) => {
    setLoading(true)
    setMessage('')

    if (data.newPassword !== data.confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Password updated successfully')
      reset({
        newPassword: '',
        confirmPassword: ''
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

            <button type="submit" className="app__btn_green" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
