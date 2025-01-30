'use client'

import { CustomButton, Title } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { Employee } from '@/types'
import { PaperclipIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Signature({ userId }: { userId: string }) {
  const [saving, setSaving] = useState(false)

  const [userData, setUserData] = useState<Employee | null>(null)

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    setSaving(true)

    if (!file) {
      setToast('error', 'Please select file')
      return
    }

    try {
      let filePath: string | null = null

      // Upload file if it exists
      if (file) {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const fileName = `${Date.now()}_${sanitizedFileName}`
        const { data: fileData, error: fileError } = await supabase.storage
          .from('hrm_public') // Replace with your storage bucket name
          .upload(`signature/${userId}/${fileName}`, file)

        if (fileError) throw new Error(fileError.message)
        filePath = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hrm_public/${fileData.path}` // Get the path of the uploaded file
      }

      const newData = {
        signature_path: filePath
      }

      const { error } = await supabase
        .from('hrm_users')
        .update(newData)
        .eq('id', userId)

      if (error) throw new Error(error.message)

      setToast('success', 'Successfully uploaded')
      // refetch data
      void fetchData()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
      setFile(null) // Reset file input
    }
  }

  const fetchData = async () => {
    const { data } = await supabase
      .from('hrm_users')
      .select()
      .eq('id', userId)
      .single()
    setUserData(data)
  }

  useEffect(() => {
    void fetchData()
  }, [])
  return (
    <>
      <div>
        <div className="app__title">
          <Title title="Scanned Signature" />
        </div>

        {/* Main Content */}
        <div className="w-full mx-4 mt-4">
          <div>
            {userData && !userData.signature_path && (
              <div className="text-sm text-gray-500">
                <div className="mb-2">No scanned signature uploaded yet.</div>
              </div>
            )}

            {userData?.signature_path && (
              <>
                <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                  Scanned Signature:
                </div>
                <div>
                  <Image
                    src={userData.signature_path}
                    width={100}
                    height={100}
                    alt=""
                  />
                </div>
              </>
            )}
          </div>

          {/* Upload Form */}
          <div className="mt-8">
            <div className="w-2/3">
              <div className="mt-2 flex flex-col space-y-2">
                {/* File Input Wrapper */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    onChange={handleFileChange}
                    className="hidden" // Hides the default file input
                    id="fileUpload"
                  />

                  {/* Custom Button for File Input */}
                  <label
                    htmlFor="fileUpload"
                    className="cursor-pointer text-gray-600 flex items-start space-x-2 p-2 border border-dashed"
                  >
                    <span>Select (100px X 100px) Scanned Signature File</span>
                    <PaperclipIcon className="w-4 h-4" />
                  </label>

                  {file && (
                    <span className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      Selected: {file.name}
                    </span>
                  )}
                </div>
                <div>
                  <CustomButton
                    containerStyles="app__btn_green"
                    title="Upload"
                    isDisabled={saving}
                    handleClick={handleUpload}
                    btnType="button"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
