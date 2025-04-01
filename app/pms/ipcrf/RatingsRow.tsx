'use client'
import { IpcrfObjectiveTypes, KraObjectiveTypes } from '@/types/pmsTypes'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'

interface CompProps {
  item: IpcrfObjectiveTypes
  status: string
  view: string
  allObjectives: KraObjectiveTypes[]
  updateObjectives: (obj: IpcrfObjectiveTypes) => void
}
export default function RatingsRow({
  item,
  status,
  view,
  allObjectives,
  updateObjectives
}: CompProps) {
  const [viewIndicator, setViewIndicator] = useState(false)
  const [cot1, setCot1] = useState(item.cot_1_rating ? item.cot_1_rating : '')
  const [cot2, setCot2] = useState(item.cot_2_rating ? item.cot_2_rating : '')
  const [cot3, setCot3] = useState(item.cot_3_rating ? item.cot_3_rating : '')
  const [cot4, setCot4] = useState(item.cot_4_rating ? item.cot_4_rating : '')
  const [quality, setQuality] = useState(
    item.quality_rating ? item.quality_rating : ''
  )
  const [efficiency, setEfficiency] = useState(
    item.efficiency_rating ? item.efficiency_rating : ''
  )
  const [timeliness, setTimeliness] = useState(
    item.timeliness_rating ? item.timeliness_rating : ''
  )
  const [objectiveArray, setObjectiveArray] =
    useState<IpcrfObjectiveTypes>(item)

  const getObjectiveItem = (id: string, field: keyof KraObjectiveTypes) => {
    const obj = allObjectives.find((item) => item.id.toString() === id)

    if (!obj) return ''

    const value = obj[field]

    return typeof value === 'string' && value.length > 100
      ? value.slice(0, 100) + '...'
      : ''
  }

  // const calculateScore = (numbers) => {
  //   // Get the QET average
  //   const [qetSum, qetCount] = numbers.reduce(
  //     (accumulator, currentValue) => {
  //       const [qetSum, qetCount] = accumulator
  //       if (currentValue !== '') {
  //         return [qetSum + Number(currentValue), qetCount + 1]
  //       } else {
  //         return [qetSum, qetCount]
  //       }
  //     },
  //     [0, 0]
  //   )

  //   // Get the average value from COT
  //   const qet = qetSum / qetCount

  //   const scr = (qet * Number(item.weight)) / 100

  //   if (!isNaN(scr)) {
  //     return scr.toFixed(3)
  //   }
  // }

  const calculateScore = (
    numbers: Array<string | number>,
    weight = 100
  ): string => {
    const [qetSum, qetCount] = numbers.reduce<[number, number]>(
      (accumulator, currentValue) => {
        const [qetSum, qetCount] = accumulator
        if (currentValue !== '') {
          return [qetSum + Number(currentValue), qetCount + 1]
        } else {
          return [qetSum, qetCount]
        }
      },
      [0, 0]
    )

    if (qetCount === 0) return ''

    const qet = qetSum / qetCount
    const scr = (qet * weight) / 100

    return !isNaN(scr) ? scr.toFixed(3) : ''
  }

  const handleCotChange = (n: number, value: string) => {
    let numbers: string[] = []
    let cotRatings: Record<string, string> = {}

    const numericValue = value

    switch (n) {
      case 1:
        setCot1(numericValue)
        numbers = [numericValue, cot2, cot3, cot4]
        cotRatings = {
          cot_1_rating: numericValue,
          cot_2_rating: cot2,
          cot_3_rating: cot3,
          cot_4_rating: cot4
        }
        break
      case 2:
        setCot2(numericValue)
        numbers = [cot1, numericValue, cot3, cot4]
        cotRatings = {
          cot_1_rating: cot1,
          cot_2_rating: numericValue,
          cot_3_rating: cot3,
          cot_4_rating: cot4
        }
        break
      case 3:
        setCot3(numericValue)
        numbers = [cot1, cot2, numericValue, cot4]
        cotRatings = {
          cot_1_rating: cot1,
          cot_2_rating: cot2,
          cot_3_rating: numericValue,
          cot_4_rating: cot4
        }
        break
      case 4:
        setCot4(numericValue)
        numbers = [cot1, cot2, cot3, numericValue]
        cotRatings = {
          cot_1_rating: cot1,
          cot_2_rating: cot2,
          cot_3_rating: cot3,
          cot_4_rating: numericValue
        }
        break
    }

    let total = 0
    let count = 0

    numbers.forEach((currentValue) => {
      if (currentValue !== '') {
        total += Number(currentValue)
        count += 1
      }
    })

    const q = count > 0 ? (total / count).toFixed(3) : '0'
    setQuality(q)

    const score = calculateScore(
      [q, efficiency, timeliness],
      Number(item.weight)
    )

    const updatedObjective = {
      ...objectiveArray,
      ...cotRatings,
      quality_rating: q,
      efficiency_rating: efficiency,
      timeliness_rating: timeliness,
      score
    }

    setObjectiveArray(updatedObjective) // Update the objective array
    updateObjectives(updatedObjective) // Update objectives from parent component
  }

  const handleQETChange = (qet: string, value: string) => {
    if (qet === 'quality') {
      setQuality(value)
      const score = calculateScore(
        [Number(value), efficiency, timeliness],
        Number(item.weight)
      ) // Calculate score on DOM
      const updatedObjective = {
        ...objectiveArray,
        quality_rating: value,
        efficiency_rating: efficiency,
        timeliness_rating: timeliness,
        score
      }
      setObjectiveArray(updatedObjective) // Update the objective array
      updateObjectives(updatedObjective) // Update objectives from parent component
    }
    if (qet === 'efficiency') {
      setEfficiency(value)
      const score = calculateScore(
        [quality, Number(value), timeliness],
        Number(item.weight)
      ) // Calculate score on DOM
      const updatedObjective = {
        ...objectiveArray,
        quality_rating: quality,
        efficiency_rating: value,
        timeliness_rating: timeliness,
        score
      }
      setObjectiveArray(updatedObjective) // Update the objective array
      updateObjectives(updatedObjective) // Update objectives from parent component
    }
    if (qet === 'timeliness') {
      setTimeliness(value)
      const score = calculateScore(
        [quality, efficiency, Number(value)],
        Number(item.weight)
      ) // Calculate score on DOM
      const updatedObjective = {
        ...objectiveArray,
        quality_rating: quality,
        efficiency_rating: efficiency,
        timeliness_rating: value,
        score
      }
      setObjectiveArray(updatedObjective) // Update the objective array
      updateObjectives(updatedObjective) // Update objectives from parent component
    }
  }

  return (
    <tr className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700">
      <td className="px-2 py-2 align-top">
        <div>{getObjectiveItem(item.id, 'title')}</div>
      </td>
      <td className="px-2 py-2 align-top">
        <div>{getObjectiveItem(item.id, 'title')}</div>
        <div className="mt-4">
          <b>MOV:</b> {getObjectiveItem(item.id, 'mov')}
          <div className="mt-4">
            <span
              onClick={() => setViewIndicator(!viewIndicator)}
              className={`text-emerald-600 font-medium cursor-pointer ${
                viewIndicator && 'hidden'
              }`}
            >
              View Performance Indicator
            </span>
            {viewIndicator && (
              <div className="bg-gray-200 border border-gray-300 px-2 py-2">
                <div className="flex justify-end">
                  <XMarkIcon
                    onClick={() => setViewIndicator(!viewIndicator)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
                <div className="text-center font-bold py-2">Quality</div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Outstanding (5)</div>
                  <div>{item.ePE5}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Very Satisfactory (4)</div>
                  <div>{item.ePE4}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Satisfactory (3)</div>
                  <div>{item.ePE3}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Unsatisfactory (2)</div>
                  <div>{item.ePE2}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Poor (1)</div>
                  <div>{item.ePE1}</div>
                </div>

                <div className="text-center font-bold py-2">Quality</div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Outstanding (5)</div>
                  <div>{item.ePE5}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Very Satisfactory (4)</div>
                  <div>{item.ePE4}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Satisfactory (3)</div>
                  <div>{item.ePE3}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Unsatisfactory (2)</div>
                  <div>{item.ePE2}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Poor (1)</div>
                  <div>{item.ePE1}</div>
                </div>

                <div className="text-center font-bold py-2">Quality</div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Outstanding (5)</div>
                  <div>{item.ePE5}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Very Satisfactory (4)</div>
                  <div>{item.ePE4}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Satisfactory (3)</div>
                  <div>{item.ePE3}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Unsatisfactory (2)</div>
                  <div>{item.ePE2}</div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="font-bold">Poor (1)</div>
                  <div>{item.ePE1}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-2 py-2 align-top text-center">{item.weight}</td>
      <td className="px-2 py-2 align-top text-center">
        {item.cot_1 && status !== 'Approved' && view !== 'as_approver' && (
          <select
            onChange={(e) => handleCotChange(1, e.target.value)}
            value={cot1}
            className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
          >
            <option value=""></option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        )}
        {item.cot_1 &&
          (status === 'Approved' || view === 'as_approver') &&
          item.cot_1}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.cot_2 && status !== 'Approved' && view !== 'as_approver' && (
          <select
            onChange={(e) => handleCotChange(2, e.target.value)}
            value={cot2}
            className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
          >
            <option value=""></option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        )}
        {item.cot_2 &&
          (status === 'Approved' || view === 'as_approver') &&
          item.cot_2}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.cot_3 && status !== 'Approved' && view !== 'as_approver' && (
          <select
            onChange={(e) => handleCotChange(3, e.target.value)}
            value={cot3}
            className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
          >
            <option value=""></option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        )}
        {item.cot_3 &&
          (status === 'Approved' || view === 'as_approver') &&
          item.cot_3}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.cot_4 && status !== 'Approved' && view !== 'as_approver' && (
          <select
            onChange={(e) => handleCotChange(4, e.target.value)}
            value={cot4}
            className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
          >
            <option value=""></option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        )}
        {item.cot_4 &&
          (status === 'Approved' || view === 'as_approver') &&
          item.cot_4}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {!item.cot_1 &&
        !item.cot_2 &&
        !item.cot_3 &&
        !item.cot_4 &&
        status !== 'Approved' &&
        view !== 'as_approver' ? (
          <select
            onChange={(e) => handleQETChange('quality', e.target.value)}
            value={quality}
            className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
          >
            <option value=""></option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        ) : (
          quality
        )}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.has_efficiency &&
          status !== 'Approved' &&
          view !== 'as_approver' && (
            <select
              onChange={(e) => handleQETChange('efficiency', e.target.value)}
              value={efficiency}
              className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
            >
              <option value=""></option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          )}
        {item.has_efficiency &&
          (status === 'Approved' || view === 'as_approver') &&
          efficiency}
      </td>
      <td className="px-2 py-2 align-top text-center">
        {item.has_timeliness &&
          status !== 'Approved' &&
          view !== 'as_approver' && (
            <select
              onChange={(e) => handleQETChange('timeliness', e.target.value)}
              value={timeliness}
              className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
            >
              <option value=""></option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          )}
        {item.has_timeliness &&
          (status === 'Approved' || view === 'as_approver') &&
          timeliness}
      </td>
      <td className="px-2 py-2 align-top text-center">{item.score}</td>
    </tr>
  )
}
