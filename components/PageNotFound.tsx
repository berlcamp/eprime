import React from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function PageNotFound () {
  return (
    <>
      <Sidebar>
        <></>
      </Sidebar>
      <TopBar/>
      <div className="app__main">
        <div className='text-center'>
          This page does not exist
        </div>
      </div>
    </>
  )
}
