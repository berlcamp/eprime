'use client'
import { XMarkIcon } from '@heroicons/react/24/solid'
import React, { useState } from 'react'

export default function RatingsRow ({ item, status, view, allObjectives, updateObjectives }) {
  const [viewIndicator, setViewIndicator] = useState(false)
  const [quality, setQuality] = useState(item.quality_rating ? item.quality_rating : '')
  const [efficiency, setEfficiency] = useState(item.efficiency_rating ? item.efficiency_rating : '')
  const [timeliness, setTimeliness] = useState(item.timeliness_rating ? item.timeliness_rating : '')
  const [objectiveArray, setObjectiveArray] = useState(item)

  const getObjectiveItem = (id, field) => {
    const obj = allObjectives.filter(item => item.id === Number(id))
    return obj[0][field].length > 100 ? obj[0][field].slice(0, 100) + '...' : obj[0][field]
  }

  const calculateScore = (numbers) => {
    // Get the QET average
    const [qetSum, qetCount] = numbers.reduce((accumulator, currentValue) => {
      const [qetSum, qetCount] = accumulator
      if (currentValue !== '') {
        return [qetSum + Number(currentValue), qetCount + 1]
      } else {
        return [qetSum, qetCount]
      }
    }, [0, 0])

    // Get the average value from COT
    const qet = qetSum / qetCount

    const scr = ((qet * Number(item.weight)) / 100)

    if (!isNaN(scr)) {
      return scr.toFixed(3)
    }
  }

  const handleQETChange = (qet, value) => {
    if (qet === 'quality') {
      setQuality(value)
      const score = calculateScore([Number(value), efficiency, timeliness]) // Calculate score on DOM
      const updatedObjective = { ...objectiveArray, quality_rating: Number(value), efficiency_rating: efficiency, timeliness_rating: timeliness, score }
      setObjectiveArray(updatedObjective) // Update the objective array
      updateObjectives(updatedObjective) // Update objectives from parent component
    }
    if (qet === 'efficiency') {
      setEfficiency(value)
      const score = calculateScore([quality, Number(value), timeliness]) // Calculate score on DOM
      const updatedObjective = { ...objectiveArray, quality_rating: quality, efficiency_rating: Number(value), timeliness_rating: timeliness, score }
      setObjectiveArray(updatedObjective) // Update the objective array
      updateObjectives(updatedObjective) // Update objectives from parent component
    }
    if (qet === 'timeliness') {
      setTimeliness(value)
      const score = calculateScore([quality, efficiency, Number(value)]) // Calculate score on DOM
      const updatedObjective = { ...objectiveArray, quality_rating: quality, efficiency_rating: efficiency, timeliness_rating: Number(value), score }
      setObjectiveArray(updatedObjective) // Update the objective array
      updateObjectives(updatedObjective) // Update objectives from parent component
    }
  }

  return (
    <tr
      className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700">
      <td className="px-2 py-2 align-top">
        <div>{getObjectiveItem(item.id, 'kra').title}</div>
      </td>
      <td className="px-2 py-2 align-top">
        <div>{getObjectiveItem(item.id, 'title')}</div>
        <div className='mt-4'><b>MOV:</b> {getObjectiveItem(item.id, 'mov')}
          <div className='mt-4'>
            <span onClick={() => setViewIndicator(!viewIndicator)} className={`text-emerald-600 font-medium cursor-pointer ${viewIndicator && 'hidden'}`}>View Performance Indicator</span>
            {
              viewIndicator &&
                <div className='bg-gray-200 border border-gray-300 px-2 py-2'>
                  <div className='flex justify-end'><XMarkIcon onClick={() => setViewIndicator(!viewIndicator)} className='w-5 h-5 cursor-pointer'/></div>
                  <div className='text-center font-bold py-2'>Quality</div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Outstanding (5)</div>
                    <div>{item.ePE5}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Very Satisfactory (4)</div>
                    <div>{item.ePE4}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Satisfactory (3)</div>
                    <div>{item.ePE3}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Unsatisfactory (2)</div>
                    <div>{item.ePE2}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Poor (1)</div>
                    <div>{item.ePE1}</div>
                  </div>

                  <div className='text-center font-bold py-2'>Quality</div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Outstanding (5)</div>
                    <div>{item.ePE5}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Very Satisfactory (4)</div>
                    <div>{item.ePE4}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Satisfactory (3)</div>
                    <div>{item.ePE3}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Unsatisfactory (2)</div>
                    <div>{item.ePE2}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Poor (1)</div>
                    <div>{item.ePE1}</div>
                  </div>

                  <div className='text-center font-bold py-2'>Quality</div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Outstanding (5)</div>
                    <div>{item.ePE5}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Very Satisfactory (4)</div>
                    <div>{item.ePE4}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Satisfactory (3)</div>
                    <div>{item.ePE3}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Unsatisfactory (2)</div>
                    <div>{item.ePE2}</div>
                  </div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <div className='font-bold'>Poor (1)</div>
                    <div>{item.ePE1}</div>
                  </div>
                </div>
            }
          </div>
        </div>
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.weight}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {
          (status !== 'Approved' && view !== 'as_approver') &&
            <select
              onChange={e => handleQETChange('quality', e.target.value)}
              value={quality}
              className='h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12'>
              <option value=''></option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
        }
        {
          (status === 'Approved' || view === 'as_approver') && quality
        }
      </td>
      <td className="px-2 py-2 align-top text-center">
        {
          (item.has_efficiency && status !== 'Approved' && view !== 'as_approver') &&
            <select
              onChange={e => handleQETChange('efficiency', e.target.value)}
              value={efficiency}
              className='h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12'>
              <option value=''></option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
        }
        {
          (item.has_efficiency && (status === 'Approved' || view === 'as_approver')) && efficiency
        }
      </td>
      <td className="px-2 py-2 align-top text-center">
        {
          (item.has_timeliness && status !== 'Approved' && view !== 'as_approver') &&
            <select
              onChange={e => handleQETChange('timeliness', e.target.value)}
              value={timeliness}
              className='h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12'>
              <option value=''></option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
        }
        {
          (item.has_timeliness && (status === 'Approved' || view === 'as_approver')) && timeliness
        }
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.score}
      </td>
    </tr>
  )
}
