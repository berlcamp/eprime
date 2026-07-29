import { LWOP_DISPLAY_MIN_DAYS } from '@/constants'

// Shared by the profile Service Record view and the printable Service Record
// so the printed form always matches what was on screen.

// Structural shape only, so both ServiceRecordTypes and the print payload
// satisfy it without either having to know about this module.
interface ServiceRecordLike {
  days_without_pay?: string | number | null
  to?: string | null
  status?: string | null
  salary?: string | null
  station?: string | null
  branch?: string | null
  assignment_id?: string | null
  separation_date?: string | null
  separation_cause?: string | null
  personnel_action?: string | null
}

const lwopDays = (sr: ServiceRecordLike | null | undefined): number =>
  Number(sr?.days_without_pay) || 0

// Leave without pay below the threshold is kept in the database but withheld
// from the Service Record, per DepEd practice.
const isShortLwop = (sr: ServiceRecordLike | null | undefined): boolean => {
  const days = lwopDays(sr)
  return days > 0 && days < LWOP_DISPLAY_MIN_DAYS
}

// Only the fields the leave approval path never fills in. A row carrying any
// of these records a real service event (appointment, promotion, reassignment,
// separation) and must survive, even when it also notes a few LWOP days.
// 'from', 'designation' and 'remarks' are deliberately excluded - the leave
// path sets those too, so they cannot distinguish the two kinds of row.
const hasServiceEvent = (sr: ServiceRecordLike | null | undefined): boolean =>
  [
    sr?.to,
    sr?.status,
    sr?.salary,
    sr?.station,
    sr?.branch,
    sr?.assignment_id,
    sr?.separation_date,
    sr?.separation_cause,
    sr?.personnel_action
  ].some((value) => String(value ?? '').trim() !== '')

// A row that exists only to log a short leave is dropped entirely.
export const isHiddenServiceRecord = (
  sr: ServiceRecordLike | null | undefined
): boolean => isShortLwop(sr) && !hasServiceEvent(sr)

// A row with real service data keeps its place but not the short LWOP figure.
export const displayDaysWithoutPay = (
  sr: ServiceRecordLike | null | undefined
): string => (isShortLwop(sr) ? '' : String(sr?.days_without_pay ?? ''))

export const visibleServiceRecords = <T extends ServiceRecordLike>(
  records: T[] | null | undefined
): T[] => (records ?? []).filter((sr) => !isHiddenServiceRecord(sr))
