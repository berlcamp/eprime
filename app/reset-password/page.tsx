'use client'
import { useSupabase } from '@/context/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface UpdatePasswordTypes {
  newPassword: string
  confirmPassword: string
}

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdatePasswordTypes>()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { supabase } = useSupabase()
  const router = useRouter()

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
      router.push('/profile')
    }

    setLoading(false)
  }

  return (
    <>
      <div className="app__home">
        <div className="bg-gray-700 h-screen pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center">
          <div className="w-1/3 bg-white p-4">
            {message !== 'Password updated successfully' && (
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

                {message === 'Password updated successfully' && (
                  <p className="text-sm mt-2 text-green-500">{message}</p>
                )}
                {message !== 'Password updated successfully' && (
                  <p className="text-sm mt-2 text-red-500">{message}</p>
                )}

                <button
                  type="submit"
                  className="app__btn_green"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
            {message && message === 'Password updated successfully' && (
              <div className="text-green-600 font-medium">
                Password successfully changed, you can now login to your account
                using your new Password.
              </div>
            )}
          </div>
        </div>
        <div className="mt-auto bg-gray-800 p-4 text-white fixed bottom-0 w-full">
          <div className="text-white text-center text-xs">&copy; ePRIME</div>
        </div>
      </div>
    </>
  )
}
