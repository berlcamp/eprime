'use client'
import { CustomButton } from '@/components/index'
import { orgChart } from '@/constants'
import { useState } from 'react'
import ProfileCard from './ProfileCard'

export default function App() {
  const [zoomLevel, setZoomLevel] = useState<number>(0.3)

  const handleZoomIn = () => {
    if (zoomLevel >= 1) return
    setZoomLevel(zoomLevel + 0.1)
  }
  const handleZoomOut = () => {
    if (zoomLevel <= 0.2) return
    setZoomLevel(zoomLevel - 0.1)
  }

  return (
    <div className="flex flex-col justify-center items-center mt-10">
      <h1 className="text-2xl">Organizational Flow Chart</h1>
      <div className="space-x-2 mt-4">
        <CustomButton
          containerStyles="app__btn_green"
          title="Zoom In"
          btnType="button"
          handleClick={handleZoomIn}
        />
        <CustomButton
          containerStyles="app__btn_green"
          title="Zoom Out"
          btnType="button"
          handleClick={handleZoomOut}
        />
      </div>
      {/* <div className="container mx-auto text-center pt-32" style={{ transformOrigin: 'top', transform: `scale(${zoomLevel})` }}> */}
      <div
        className="text-center pt-32"
        style={{
          transformOrigin: 'top',
          transform: `scale(${zoomLevel})`
        }}
      >
        <div className="items-start justify-center flex">
          {orgChart.map((profile, idX) => (
            <ProfileCard key={idX} {...profile} />
          ))}
        </div>
      </div>
    </div>
  )
}
