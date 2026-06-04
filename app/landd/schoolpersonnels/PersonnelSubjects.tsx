import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import {
  CoordinatorshipTypes,
  Employee,
  MajorTypes,
  SchoolYearTypes,
  SubjectTypes
} from '@/types'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  employee: Employee
}

interface PillProps {
  label: string
  checked: boolean
  onChange: () => void
}

const Pill = ({ label, checked, onChange }: PillProps) => (
  <button
    type="button"
    onClick={onChange}
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${
      checked
        ? 'bg-green-50 border-green-500 text-green-700'
        : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
    }`}
  >
    {checked && (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
    {label}
  </button>
)

const SectionCard = ({
  title,
  count,
  children
}: {
  title: string
  count?: number
  children: React.ReactNode
}) => (
  <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      {count !== undefined && count > 0 && (
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {count} selected
        </span>
      )}
    </div>
    <div className="p-3">{children}</div>
  </div>
)

const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
]

const CATEGORY_ORDER = ['Elementary', 'Junior High School', 'Senior High School']

const PersonnelSubjects = ({ hideModal, employee }: ModalProps) => {
  const [saving, setSaving] = useState(false)

  const [subjects, setSubjects] = useState<SubjectTypes[]>([])
  const [coordinatorships, setCoordinatorships] = useState<CoordinatorshipTypes[]>([])
  const [majors, setMajors] = useState<MajorTypes[]>([])

  const [schoolYears, setSchoolYears] = useState<SchoolYearTypes[]>([])
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>('')
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  const [selectedGradeLevels, setSelectedGradeLevels] = useState<string[]>(
    employee.grade_levels.map((g) => g.grade_level)
  )
  const [selectedMajorIds, setSelectedMajorIds] = useState<string[]>(
    employee.majors.map((m) => m.major_id)
  )
  const [selectedCoordinatorshipIds, setSelectedCoordinatorshipIds] = useState<string[]>(
    employee.coordinatorships.map((c) => c.coordinatorship_id)
  )

  const { supabase } = useSupabase()
  const { setToast } = useFilter()
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const toggle = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  const fullName = [employee.firstname, employee.middlename, employee.lastname]
    .filter(Boolean)
    .join(' ')

  const assignment = employee.hrm_schools?.name ?? employee.hrm_offices?.name ?? ''

  const subjectsByCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = subjects.filter((s) => s.category_level === cat)
      return acc
    },
    {} as Record<string, SubjectTypes[]>
  )

  const handleSave = async () => {
    if (saving) return
    setSaving(true)

    try {
      // GRADE LEVELS
      await supabase.from('hrm_personnel_grade_levels').delete().eq('user_id', employee.id)
      if (selectedGradeLevels.length > 0) {
        await supabase.from('hrm_personnel_grade_levels').insert(
          selectedGradeLevels.map((level) => ({ user_id: employee.id, grade_level: level }))
        )
      }

      // SUBJECTS — scoped to selected school year
      if (selectedSchoolYearId) {
        await supabase
          .from('hrm_personnel_subjects')
          .delete()
          .eq('user_id', employee.id)
          .eq('school_year_id', selectedSchoolYearId)
        if (selectedSubjectIds.length > 0) {
          await supabase.from('hrm_personnel_subjects').insert(
            selectedSubjectIds.map((id) => ({
              user_id: employee.id,
              subject_id: id,
              school_year_id: selectedSchoolYearId
            }))
          )
        }
      }

      // MAJORS
      await supabase.from('hrm_personnel_majors').delete().eq('user_id', employee.id)
      if (selectedMajorIds.length > 0) {
        await supabase.from('hrm_personnel_majors').insert(
          selectedMajorIds.map((id) => ({ user_id: employee.id, major_id: id }))
        )
      }

      // COORDINATORSHIPS
      await supabase.from('hrm_personnel_coordinatorships').delete().eq('user_id', employee.id)
      if (selectedCoordinatorshipIds.length > 0) {
        await supabase.from('hrm_personnel_coordinatorships').insert(
          selectedCoordinatorshipIds.map((id) => ({
            user_id: employee.id,
            coordinatorship_id: id
          }))
        )
      }

      // Update redux
      const items = [...globallist]
      const updatedData = {
        id: employee.id,
        grade_levels: selectedGradeLevels.map((level) => ({
          id: level, user_id: employee.id, grade_level: level
        })),
        subjects: selectedSubjectIds.map((subject_id) => ({
          id: subject_id, user_id: employee.id, subject_id, school_year_id: selectedSchoolYearId
        })),
        majors: selectedMajorIds.map((major_id) => ({
          id: major_id, user_id: employee.id, major_id
        })),
        coordinatorships: selectedCoordinatorshipIds.map((coordinatorship_id) => ({
          id: coordinatorship_id, user_id: employee.id, coordinatorship_id
        }))
      }
      const idx = items.findIndex((x) => x.id === employee.id)
      items[idx] = { ...items[idx], ...updatedData }
      dispatch(updateList(items))

      setToast('success', 'Successfully saved.')
      hideModal()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Reload subjects when school year changes
  useEffect(() => {
    if (!selectedSchoolYearId) return
    const load = async () => {
      setLoadingSubjects(true)
      const { data } = await supabase
        .from('hrm_personnel_subjects')
        .select()
        .eq('user_id', employee.id)
        .eq('school_year_id', selectedSchoolYearId)
      if (data) setSelectedSubjectIds(data.map((ps: any) => ps.subject_id))
      setLoadingSubjects(false)
    }
    void load()
  }, [selectedSchoolYearId])

  useEffect(() => {
    const fetchAll = async () => {
      const [subjectsRes, coordRes, majorsRes, syRes] = await Promise.all([
        supabase.from('hrm_subjects').select(),
        supabase.from('hrm_coordinatorships').select(),
        supabase.from('hrm_majors').select(),
        supabase.from('hrm_school_years').select().order('title', { ascending: false })
      ])
      if (subjectsRes.data) setSubjects(subjectsRes.data)
      if (coordRes.data) setCoordinatorships(coordRes.data)
      if (majorsRes.data) setMajors(majorsRes.data)
      if (syRes.data) {
        setSchoolYears(syRes.data)
        const active = syRes.data.find((sy: SchoolYearTypes) => sy.is_active)
        if (active) setSelectedSchoolYearId(active.id)
      }
    }
    void fetchAll()
  }, [])

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">

          {/* Header */}
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">Personnel Details</h5>
            <button
              type="button"
              onClick={hideModal}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-3 py-1 bg-white hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Employee info strip */}
          <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={fullName}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm flex-shrink-0">
                {employee.firstname?.[0]}{employee.lastname?.[0]}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-gray-800">{fullName}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                {employee.hrm_positions?.name && (
                  <span>{employee.hrm_positions.name}</span>
                )}
                {employee.hrm_positions?.name && assignment && (
                  <span className="text-gray-300">·</span>
                )}
                {assignment && <span>{assignment}</span>}
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Grade Levels */}
            <SectionCard title="Grade Levels" count={selectedGradeLevels.length}>
              <div className="flex flex-wrap gap-2">
                {GRADE_LEVELS.map((lvl) => (
                  <Pill
                    key={lvl}
                    label={lvl}
                    checked={selectedGradeLevels.includes(lvl)}
                    onChange={() => toggle(lvl, selectedGradeLevels, setSelectedGradeLevels)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* Subjects */}
            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Subjects</span>
                  {selectedSubjectIds.length > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {selectedSubjectIds.length} selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">School Year</span>
                  <select
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400"
                    value={selectedSchoolYearId}
                    onChange={(e) => setSelectedSchoolYearId(e.target.value)}
                  >
                    <option value="">Select year</option>
                    {schoolYears.map((sy) => (
                      <option key={sy.id} value={sy.id}>
                        {sy.title}{sy.is_active ? ' (Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3">
                {!selectedSchoolYearId ? (
                  <p className="text-xs text-gray-400 italic py-1">
                    Select a school year to manage subjects.
                  </p>
                ) : loadingSubjects ? (
                  <p className="text-xs text-gray-400 py-1">Loading...</p>
                ) : subjects.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">No subjects configured.</p>
                ) : (
                  <div className="space-y-3">
                    {CATEGORY_ORDER.map((cat) => {
                      const items = subjectsByCategory[cat]
                      if (!items || items.length === 0) return null
                      return (
                        <div key={cat}>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                            {cat}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item) => (
                              <Pill
                                key={item.id}
                                label={item.title}
                                checked={selectedSubjectIds.includes(item.id)}
                                onChange={() =>
                                  toggle(item.id, selectedSubjectIds, setSelectedSubjectIds)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Majors */}
            <SectionCard title="Majors" count={selectedMajorIds.length}>
              {majors.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No majors configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {majors.map((item) => (
                    <Pill
                      key={item.id}
                      label={item.title}
                      checked={selectedMajorIds.includes(item.id)}
                      onChange={() => toggle(item.id, selectedMajorIds, setSelectedMajorIds)}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Coordinatorships */}
            <SectionCard title="Coordinatorships" count={selectedCoordinatorshipIds.length}>
              {coordinatorships.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No coordinatorships configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {coordinatorships.map((item) => (
                    <Pill
                      key={item.id}
                      label={item.title}
                      checked={selectedCoordinatorshipIds.includes(item.id)}
                      onChange={() =>
                        toggle(item.id, selectedCoordinatorshipIds, setSelectedCoordinatorshipIds)
                      }
                    />
                  ))}
                </div>
              )}
            </SectionCard>

          </div>

          {/* Sticky footer */}
          <div className="border-t border-gray-200 px-4 py-3 bg-white flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={hideModal}
              className="text-xs text-gray-600 border border-gray-300 rounded px-4 py-1.5 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded px-4 py-1.5 font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default PersonnelSubjects
