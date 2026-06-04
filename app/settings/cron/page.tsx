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

  const [syMessage, setSyMessage] = useState<string | null>(null)
  const [syError, setSyError] = useState<string | null>(null)
  const [isSyLoading, setIsSyLoading] = useState<boolean>(false)

  const handleRunAllCron = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cronann', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to run cron jobs.')
        setMessage(null)
        return
      }
      setMessage('Cron jobs ran successfully!')
      setError(null)
    } catch (error) {
      setError('An error occurred while running cron jobs.')
      setMessage(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunSchoolYearCron = async () => {
    setIsSyLoading(true)
    try {
      const response = await fetch('/api/cronschoolyear', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!response.ok) {
        setSyError(data.message || 'Failed to advance school year.')
        setSyMessage(null)
        return
      }
      setSyMessage(typeof data === 'string' ? data : 'School year cron ran successfully!')
      setSyError(null)
    } catch (error) {
      setSyError('An error occurred while running school year cron.')
      setSyMessage(null)
    } finally {
      setIsSyLoading(false)
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

          <div className="app__content pb-20 space-y-8">
            <div>
              <div className="font-semibold text-gray-700 mb-2">General Cron</div>
              <CustomButton
                containerStyles="app__btn_green"
                title={isLoading ? 'Running cron..' : 'Run All Cron'}
                btnType="button"
                isDisabled={isLoading}
                handleClick={handleRunAllCron}
              />
              {isLoading && <div className="mt-4 text-blue-500">Loading...</div>}
              {message && <div className="mt-4 text-green-500">{message}</div>}
              {error && <div className="mt-4 text-red-500">{error}</div>}
            </div>

            <div>
              <div className="font-semibold text-gray-700 mb-1">School Year Cron</div>
              <div className="text-sm text-gray-500 mb-2">
                Checks today&apos;s date against all school year ranges and sets the matching one as active.
              </div>
              <CustomButton
                containerStyles="app__btn_green"
                title={isSyLoading ? 'Running..' : 'Advance School Year'}
                btnType="button"
                isDisabled={isSyLoading}
                handleClick={handleRunSchoolYearCron}
              />
              {isSyLoading && <div className="mt-4 text-blue-500">Loading...</div>}
              {syMessage && <div className="mt-4 text-green-500">{syMessage}</div>}
              {syError && <div className="mt-4 text-red-500">{syError}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
