'use client'
import { StatusFlow } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import type { DocumentTypes } from '@/types'
// import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

export default function TrackerBox() {
  const [routingNo, setRoutingNo] = useState('')
  const [documentData, setDocumentData] = useState<DocumentTypes | null>(null)
  const [notFound, setNotFound] = useState(false)

  // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  // const supabase = createBrowserClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // )

  const { supabase } = useSupabase()

  const handleTrack = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (routingNo.trim() === '') {
      setRoutingNo('')
      setDocumentData(null)
      return
    }

    const { data } = await supabase
      .from('hrm_request_trackers')
      .select()
      .eq('reference_code', routingNo.toUpperCase())
      .limit(1)
      .single()

    if (data) {
      setDocumentData(data)
      setNotFound(false)
    } else {
      setNotFound(true)
      setDocumentData(null)
    }
  }

  return (
    <div>
      <div>
        <div className="text-2xl text-center">Track and Trace Your Request</div>
        <form onSubmit={handleTrack}>
          <div className="flex items-center space-x-2 justify-center mt-4">
            <input
              type="text"
              value={routingNo}
              onChange={(e) => setRoutingNo(e.target.value)}
              className="border outline-none px-2 py-2 text-sm w-72"
              placeholder="Enter your Reference Code"
            />
            <button
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-500 border border-emerald-600 font-bold px-8 py-2 text-sm text-white rounded-sm"
              type="submit"
            >
              Track
            </button>
          </div>
        </form>
      </div>
      {notFound && (
        <div className="my-10 text-center text-gray-700">
          No record matched to this reference code.
        </div>
      )}
      <div className="w-full px-10 mt-10 pb-20">
        {documentData && (
          <>
            <div className="pl-4 mb-2">
              <span className="text-gray-700 text-sm">Request Type: </span>
              <span className="font-bold text-sm">{documentData.type}</span>
            </div>
            <div className="pl-4 mb-2">
              <span className="text-gray-700 text-sm">Current Status: </span>
              <span className="font-bold text-sm">
                {documentData.current_status}{' '}
              </span>
            </div>
            <div className="pl-4 mt-8 mb-6 font-bold text-gray-700">
              Tracker
            </div>
            <StatusFlow documentId={documentData.id} updateStatusFlow={true} />
          </>
        )}
      </div>
      <div className="mt-auto bg-gray-800 p-4 text-white fixed bottom-0 w-full">
        <div className="text-white text-center text-xs">
          &copy; DOC-TRACKER v2.0
        </div>
      </div>
    </div>
  )
}
