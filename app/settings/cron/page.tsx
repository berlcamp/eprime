'use client'
import {
  CustomButton,
  SettingsSideBar,
  Sidebar,
  Title
} from '@/components/index'
import TopBar from '@/components/TopBar'
import React, { useState } from 'react'

const Page: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleRunAllCron = async () => {
    setIsLoading(true) // Set loading to true when the request starts
    try {
      const response = await fetch('/api/cronann', {
        method: 'GET', // or 'POST', depending on your API implementation
        headers: {
          'Content-Type': 'application/json' // if your API expects JSON
        }
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to run cron jobs.')
        setMessage(null) // clear success message if there’s an error
        return
      }

      setMessage('Cron jobs ran successfully!')
      setError(null) // clear any previous error message
    } catch (error) {
      setError('An error occurred while running cron jobs.')
      setMessage(null) // clear success message if there’s an error
    } finally {
      setIsLoading(false) // Set loading to false once the request finishes
    }
  }

  return (
    <>
      <Sidebar>
        <SettingsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Cron Jobs" />
          </div>

          <div className="app__content pb-20">
            <CustomButton
              containerStyles="app__btn_green"
              title={isLoading ? 'Running cron..' : 'Run All Cron'}
              btnType="button"
              isDisabled={isLoading}
              handleClick={handleRunAllCron}
            />

            {/* Loading indicator */}
            {isLoading && (
              <div className="mt-4 text-blue-500">Loading...</div> // You can replace this with a spinner or loading animation
            )}

            {message && <div className="mt-4 text-green-500">{message}</div>}

            {error && <div className="mt-4 text-red-500">{error}</div>}
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
