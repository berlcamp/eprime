'use client'
import {
  IpcrfTemplatesCompetencyTypes,
  IpcrfTemplatesObjectives,
  IpcrfTypes
} from '@/types/pmsTypes'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'

interface Props {
  ipcrf: IpcrfTypes
  objectives: IpcrfTemplatesObjectives[]
  competencies: IpcrfTemplatesCompetencyTypes[]
  onSubmit: (ratings: {
    objectiveRatings: Record<number, any>
    competencyRatings: Record<number, number[]>
  }) => void
  initialObjectiveRatings?: Record<
    number,
    { quality?: number; efficiency?: number; timeliness?: number }
  >
  initialCompetencyRatings?: Record<number, number[]>
}

export default function RatingForm({
  ipcrf,
  objectives,
  competencies,
  onSubmit,
  initialObjectiveRatings = {},
  initialCompetencyRatings = {}
}: Props) {
  const [objectiveRatings, setObjectiveRatings] = useState(
    initialObjectiveRatings
  )
  const [competencyRatings, setCompetencyRatings] = useState(
    initialCompetencyRatings
  )

  const handleSubmit = () => {
    onSubmit({ objectiveRatings, competencyRatings })
    toast.success('Rating successfully saved')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      <h2 className="text-xl font-bold mb-4">Objective Ratings</h2>
      {objectives.map((obj) => (
        <div key={obj.id} className="mb-4 border p-4 rounded space-y-2">
          <div className="font-semibold">{obj.objective?.title}</div>
          <div className="italic font-semibold">(Weight: {obj.weight})</div>
          {ipcrf.template?.type === 'OPCRF' && (
            <div className="italic font-semibold">(Target: {obj.target})</div>
          )}
          {obj.quality && (
            <div>
              <label>Quality:</label>
              {[5, 4, 3, 2, 1].map((score) => (
                <label key={score} className="mx-1 block">
                  <input
                    type="radio"
                    name={`quality_${obj.id}`}
                    value={score}
                    checked={objectiveRatings[obj.id]?.quality === score}
                    onChange={() =>
                      setObjectiveRatings((prev) => ({
                        ...prev,
                        [obj.id]: { ...prev[obj.id], quality: score }
                      }))
                    }
                  />{' '}
                  {score}
                  {/* Display labels for ratings */}
                  {score === 5 && (
                    <span className="ml-2">
                      Outstanding: {obj.quality_outstanding}
                    </span>
                  )}
                  {score === 4 && (
                    <span className="ml-2">
                      Very Satisfactory: {obj.quality_very_satisfactory}
                    </span>
                  )}
                  {score === 3 && (
                    <span className="ml-2">
                      Satisfactory: {obj.quality_satisfactory}
                    </span>
                  )}
                  {score === 2 && (
                    <span className="ml-2">
                      Unsatisfactory: {obj.quality_unsatisfactory}
                    </span>
                  )}
                  {score === 1 && (
                    <span className="ml-2">Poor: {obj.quality_poor}</span>
                  )}
                </label>
              ))}
              <div className="my-4 text-sm">
                Attach MOV <input type="file" />
              </div>
            </div>
          )}
          {obj.efficiency && (
            <div>
              <label>Efficiency:</label>
              {[5, 4, 3, 2, 1].map((score) => (
                <label key={score} className="mx-1 block">
                  <input
                    type="radio"
                    name={`efficiency_${obj.id}`}
                    value={score}
                    checked={objectiveRatings[obj.id]?.efficiency === score}
                    onChange={() =>
                      setObjectiveRatings((prev) => ({
                        ...prev,
                        [obj.id]: { ...prev[obj.id], efficiency: score }
                      }))
                    }
                  />{' '}
                  {/* Display labels for ratings */}
                  {score === 5 && (
                    <span className="ml-2">
                      Outstanding: {obj.efficiency_outstanding}
                    </span>
                  )}
                  {score === 4 && (
                    <span className="ml-2">
                      Very Satisfactory: {obj.efficiency_very_satisfactory}
                    </span>
                  )}
                  {score === 3 && (
                    <span className="ml-2">
                      Satisfactory: {obj.efficiency_satisfactory}
                    </span>
                  )}
                  {score === 2 && (
                    <span className="ml-2">
                      Unsatisfactory: {obj.efficiency_unsatisfactory}
                    </span>
                  )}
                  {score === 1 && (
                    <span className="ml-2">Poor: {obj.efficiency_poor}</span>
                  )}
                </label>
              ))}
              <div className="my-4 text-sm">
                Attach MOV <input type="file" />
              </div>
            </div>
          )}
          {obj.timeliness && (
            <div>
              <label>Timeliness:</label>
              {[5, 4, 3, 2, 1].map((score) => (
                <label key={score} className="mx-1 block">
                  <input
                    type="radio"
                    name={`timeliness_${obj.id}`}
                    value={score}
                    checked={objectiveRatings[obj.id]?.timeliness === score}
                    onChange={() =>
                      setObjectiveRatings((prev) => ({
                        ...prev,
                        [obj.id]: { ...prev[obj.id], timeliness: score }
                      }))
                    }
                  />{' '}
                  {/* Display labels for ratings */}
                  {score === 5 && (
                    <span className="ml-2">
                      Outstanding: {obj.timeliness_outstanding}
                    </span>
                  )}
                  {score === 4 && (
                    <span className="ml-2">
                      Very Satisfactory: {obj.timeliness_very_satisfactory}
                    </span>
                  )}
                  {score === 3 && (
                    <span className="ml-2">
                      Satisfactory: {obj.timeliness_satisfactory}
                    </span>
                  )}
                  {score === 2 && (
                    <span className="ml-2">
                      Unsatisfactory: {obj.timeliness_unsatisfactory}
                    </span>
                  )}
                  {score === 1 && (
                    <span className="ml-2">Poor: {obj.timeliness_poor}</span>
                  )}
                </label>
              ))}
              <div className="my-4 text-sm">
                Attach MOV <input type="file" />
              </div>
            </div>
          )}
        </div>
      ))}

      <h2 className="text-xl font-bold mb-4">Competency Ratings</h2>
      {competencies.map((comp) => (
        <div key={comp.id} className="my-4">
          <div className="font-semibold">{comp.competency?.title} </div>
          {comp.competency.compentency_items?.map((item) => (
            <label key={item.id} className="mx-1 block">
              <input
                type="checkbox"
                checked={(competencyRatings[comp.competency.id] || []).includes(
                  item.id
                )}
                onChange={(e) => {
                  setCompetencyRatings((prev) => {
                    const current = prev[comp.competency.id] || []
                    const updated = e.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id)
                    return { ...prev, [comp.competency.id]: updated }
                  })
                }}
              />{' '}
              {item.title}
            </label>
          ))}
        </div>
      ))}

      <div className="mt-6">
        <Button type="submit" variant="green">
          Save Ratings
        </Button>
      </div>
    </form>
  )
}
