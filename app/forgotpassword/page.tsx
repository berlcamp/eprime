'use client'
import { TopBarDark } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface UpdatePasswordTypes {
  email: string
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

  const handlePasswordChange = async (data: UpdatePasswordTypes) => {
    setLoading(true)
    setMessage('') //

    // Send a password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: 'https://eprime.sortbrite.com/reset-password' // Redirect URL after reset
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        'An email with a password reset link has been sent to your inbox.'
      )
    }

    setLoading(false)
  }

  return (
    <>
      <div className="app__home">
        <TopBarDark isGuest={true} />
        <div className="bg-gray-700 h-screen pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center">
          <div className="w-1/3 bg-white p-4">
            {message !==
              'An email with a password reset link has been sent to your inbox.' && (
              <form onSubmit={handleSubmit(handlePasswordChange)}>
                <div className="mb-4">
                  <label className="app__label_standard">
                    Enter your Email
                  </label>
                  <input
                    type="text"
                    className="app__input_standard"
                    {...register('email', {
                      required: 'Email is required'
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">
                      {errors.email.message}
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
                  className="app__btn_green"
                  disabled={loading}
                >
                  {loading ? 'Sending reset link' : 'Reset my Password'}
                </button>
              </form>
            )}
            {message ===
              'An email with a password reset link has been sent to your inbox.' && (
              <div className="font-medium">{message}</div>
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
