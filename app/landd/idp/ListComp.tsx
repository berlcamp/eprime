'use client'

import { RootState } from '@/types' // Import the RootState type
import { Idp } from '@/types/pmsTypes'
import { useSelector } from 'react-redux'

// Always update this on other pages
type ItemType = Idp

export const ListComp = () => {
  // Redux staff
  const list = useSelector((state: RootState) => state.list2.value)

  return (
    <div className="overflow-x-none mt-10">
      <div className="flex space-x-2 mb-2">
        <div className="flex-1 text-xl font-medium">Compentencies</div>
      </div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th">Strength</th>
            <th className="app__th">Development Needs</th>
            <th className="app__th">Learning Objective</th>
            <th className="app__th">Intervention</th>
            <th className="app__th">Timeline</th>
            <th className="app__th">Resources Needed</th>
          </tr>
        </thead>
        <tbody>
          {list?.map((item: ItemType) => (
            <tr key={item.id} className="app__tr">
              <td className="app__td">
                {item.type === 'strength' && (
                  <div>
                    {item.is_custom_competency ? (
                      item.custom_competency
                    ) : (
                      <span>
                        {item.competency_item?.competency?.title} -{' '}
                        {item.competency_item?.title}
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="app__td">
                {item.type === 'weak' && (
                  <div>
                    {item.is_custom_competency ? (
                      item.custom_competency
                    ) : (
                      <span>
                        {item.competency_item?.competency?.title} -{' '}
                        {item.competency_item?.title}
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="app__td">{item.learning_objective}</td>
              <td className="app__td">
                {item.is_custom_intervention
                  ? item.custom_intervention
                  : item.intervention}
              </td>
              <td className="app__td">{item.timeline}</td>
              <td className="app__td">{item.resources}</td>
            </tr>
          ))}
          {(!list || list?.length === 0) && (
            <tr className="app__tr">
              <td className="app__td" colSpan={7}>
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
