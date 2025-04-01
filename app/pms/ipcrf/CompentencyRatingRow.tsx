'use client'
import { CompetencyItemTypes } from '@/types/pmsTypes'
import { useState } from 'react'

interface CompTypes {
  item: CompetencyItemTypes
  status: string
  view: string
  handleUpdateRating: (item: CompetencyItemTypes) => void
}

export default function CompentencyRatingRow({
  item,
  status,
  view,
  handleUpdateRating
}: CompTypes) {
  const [rating, setRating] = useState(item.rating ? item.rating : '')

  const handleChangeRating = (value: string) => {
    setRating(value)
    const newItem = { ...item, rating: value }
    handleUpdateRating(newItem)
  }

  return (
    <tr className="bg-gray-50 text-xs border-b dark:bg-gray-800 dark:border-gray-700">
      <td className="px-2 py-2">{item.title}</td>
      <td className="px-2 py-2">
        {status !== 'Approved' &&
          view !== 'as_rater' &&
          view !== 'as_approver' && (
            <div>
              <select
                onChange={(e) => handleChangeRating(e.target.value)}
                value={rating}
                className="h-7 ring-0 outline-none border border-gray-300 rounded-sm px-1 w-12"
              >
                <option value=""></option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          )}
        {(status === 'Approved' ||
          view === 'as_rater' ||
          view === 'as_approver') &&
          rating}
      </td>
    </tr>
  )
}
