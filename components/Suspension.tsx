import Footer from '@/components/Footer'

export default function Suspension() {
  return (
    <div className="app__home">
      <div className="bg-gray-700 py-20 px-6 md:flex items-center justify-center">
        <div className="z-10 max-w-md w-full">
          <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
            <h1 className="text-3xl font-bold mb-4">Temporary Access Restriction</h1>
            <p className="text-base mb-6">
              Your account is currently under temporary restriction due to an unpaid monthly subscription.
              Once payment is completed, access will be automatically restored.
            </p>
            <div className="text-gray-500 text-sm">
              Thank you for your cooperation.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
