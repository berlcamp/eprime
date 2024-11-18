'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TrackerApplicationBox() {
  const [code, setCode] = useState('')

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (code.trim() === '') {
      return
    }

    router.push(`/applicantstatus?code=${code}`)
  }

  return (
    <div>
      <div>
        <div className="text-2xl text-center">
          Check your Application Status
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center space-x-2 justify-center mt-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border outline-none px-2 py-2 text-sm w-72"
              placeholder="Enter your Application Code"
            />
            <button
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-500 border border-emerald-600 font-bold px-8 py-2 text-sm text-white rounded-sm"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
