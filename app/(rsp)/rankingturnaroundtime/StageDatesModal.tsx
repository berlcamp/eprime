import { CustomButton } from '@/components/index'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import type { ResolvedStage } from '@/utils/turnaroundTime'
import { logError } from '@/utils/fetchApi'
import { format } from 'date-fns'
import { useState } from 'react'

interface ModalProps {
  rankingId: string
  stage: ResolvedStage
  hideModal: () => void
  refetch: () => void
}

// <input type="date"> speaks yyyy-MM-dd only.
const toInputValue = (date: Date | null) =>
  date ? format(date, 'yyyy-MM-dd') : ''

const StageDatesModal = ({
  rankingId,
  stage,
  hideModal,
  refetch
}: ModalProps) => {
  // An inferred end is a guess borrowed from the next stage, not a date anyone
  // recorded, so it is not offered as the starting value to edit.
  const [dateFrom, setDateFrom] = useState(toInputValue(stage.from))
  const [dateTo, setDateTo] = useState(
    stage.toIsInferred ? '' : toInputValue(stage.to)
  )
  const [saving, setSaving] = useState(false)

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  const handleSave = async () => {
    if (saving) return

    if (dateFrom !== '' && dateTo !== '' && dateTo < dateFrom) {
      setToast('error', 'End date cannot be earlier than the start date.')
      return
    }

    setSaving(true)

    const newData = {
      ranking_id: rankingId,
      stage_key: stage.key,
      date_from: dateFrom === '' ? null : dateFrom,
      date_to: dateTo === '' ? null : dateTo
    }

    try {
      const { error } = await supabase
        .from('hrm_ranking_stage_dates')
        .upsert(newData, { onConflict: 'ranking_id, stage_key' })

      if (error) {
        void logError(
          'Save ranking stage dates',
          'hrm_ranking_stage_dates',
          JSON.stringify(newData),
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      setToast('success', 'Successfully saved.')
      setSaving(false)
      hideModal()
      refetch()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  // Drops the manual row so the stage falls back to what the app recorded.
  const handleReset = async () => {
    if (saving) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('hrm_ranking_stage_dates')
        .delete()
        .eq('ranking_id', rankingId)
        .eq('stage_key', stage.key)

      if (error) {
        void logError(
          'Reset ranking stage dates',
          'hrm_ranking_stage_dates',
          stage.key,
          error.message
        )
        setToast(
          'error',
          'Saving failed, please reload the page and try again.'
        )
        throw new Error(error.message)
      }

      setToast('success', 'Reset to the recorded dates.')
      setSaving(false)
      hideModal()
      refetch()
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">{stage.label}</h5>
            <CustomButton
              containerStyles="app__btn_gray"
              title="Close"
              isDisabled={saving}
              btnType="button"
              handleClick={hideModal}
            />
          </div>

          <div className="app__modal_body">
            <p className="text-xs text-gray-500 mb-4">
              Recorded automatically from: {stage.source}. Dates entered here
              override that.
            </p>

            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Start Date</div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="app__input_standard"
                />
              </div>
            </div>

            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">End Date</div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="app__input_standard"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for a one-off milestone. The report then counts
                  the days up to the next stage.
                </p>
              </div>
            </div>

            <hr className="my-6" />
            <div className="app__modal_footer">
              {stage.isManual && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleReset}
                  className="app__btn_gray_sm"
                >
                  Reset to recorded dates
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="app__btn_green_sm"
              >
                {saving ? 'Saving..' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StageDatesModal
