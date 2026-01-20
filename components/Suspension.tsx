export default function Suspension() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full">
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
  )
}
