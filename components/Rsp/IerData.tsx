import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { ApplicantIerTypes } from '@/types'
import { TrashIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmModal from '../ConfirmModal'

export default function IerData({
  applicantId,
  canDelete,
  refreshIer
}: {
  applicantId: string
  canDelete: boolean
  refreshIer: boolean
}) {
  const [list, setList] = useState<ApplicantIerTypes[] | []>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedId, setSelectedId] = useState('')

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const handleDeleteConfirmed = async () => {
    const { error } = await supabase
      .from('hrm_ranking_applicant_ier')
      .delete()
      .eq('id', selectedId)
    if (!error) {
      setToast('success', 'Successfully deleted')
    }
    setShowDeleteModal(false)
    void fetchData()
  }

  const triggerDelete = (id: string) => {
    setSelectedId(id)
    setShowDeleteModal(true)
  }
  const fetchData = async () => {
    const { data } = await supabase
      .from('hrm_ranking_applicant_ier')
      .select()
      .eq('applicant_id', applicantId)
    setList(data)
  }
  useEffect(() => {
    void fetchData()
  }, [refreshIer, applicantId])

  return (
    <div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th">Education</th>
            <th className="app__th">Eligibility</th>
            <th className="app__th">Training</th>
            <th className="app__th">Experience</th>
          </tr>
        </thead>
        <tbody>
          <tr className="app__tr">
            <td className="app__td space-y-2">
              {list
                .filter((l) => l.type === 'Education')
                ?.map((l, i) => (
                  <div key={i}>
                    <div className="flex space-x-2">
                      {canDelete && (
                        <TrashIcon
                          onClick={() => triggerDelete(l.id)}
                          className="w-4 h-4 cursor-pointer text-red-500"
                        />
                      )}
                      <div>
                        {i + 1}. {l.remarks} ({l.time}) ({l.status})
                      </div>
                    </div>
                  </div>
                ))}
            </td>
            <td className="app__td space-y-2">
              {list
                .filter((l) => l.type === 'Eligibility')
                ?.map((l, i) => (
                  <div key={i}>
                    <div className="flex space-x-2">
                      {canDelete && (
                        <TrashIcon
                          onClick={() => triggerDelete(l.id)}
                          className="w-4 h-4 cursor-pointer text-red-500"
                        />
                      )}
                      <div>
                        {i + 1}. {l.remarks} ({l.time}) ({l.status})
                      </div>
                    </div>
                  </div>
                ))}
            </td>
            <td className="app__td space-y-2">
              {list
                .filter((l) => l.type === 'Training')
                ?.map((l, i) => (
                  <div key={i}>
                    <div className="flex space-x-2">
                      {canDelete && (
                        <TrashIcon
                          onClick={() => triggerDelete(l.id)}
                          className="w-4 h-4 cursor-pointer text-red-500"
                        />
                      )}
                      <div>
                        {i + 1}. {l.remarks} ({l.time}) ({l.status})
                      </div>
                    </div>
                  </div>
                ))}
            </td>
            <td className="app__td space-y-2">
              {list
                .filter((l) => l.type === 'Experience')
                ?.map((l, i) => (
                  <div key={i}>
                    <div className="flex space-x-2">
                      {canDelete && (
                        <TrashIcon
                          onClick={() => triggerDelete(l.id)}
                          className="w-4 h-4 cursor-pointer text-red-500"
                        />
                      )}
                      <div>
                        {i + 1}. {l.remarks} ({l.time}) ({l.status})
                      </div>
                    </div>
                  </div>
                ))}
            </td>
          </tr>
        </tbody>
      </table>
      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to delete this?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
