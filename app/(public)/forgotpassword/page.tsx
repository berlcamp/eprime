'use client'
import Footer from '@/components/Footer'
import { TopBarDark } from '@/components/index'

export default function ForgotPassword() {
  return (
    <>
      <div className="app__home">
        <TopBarDark isGuest={true} />
        <div className="bg-gray-700 h-screen pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center">
          <div className="w-1/3 bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-semibold mb-3">Password Reset</h4>
            <p className="text-sm text-gray-700">
              Self-service password reset is currently unavailable. To reset
              your password, please contact the HR office to submit a password
              reset request.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
