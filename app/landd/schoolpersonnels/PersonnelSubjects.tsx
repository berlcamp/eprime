import { CustomButton } from '@/components'
import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import {
  CoordinatorshipTypes,
  Employee,
  MajorTypes,
  SubjectTypes
} from '@/types'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

interface ModalProps {
  hideModal: () => void
  employee: Employee
}

interface PersonnelFormTypes {
  id: string
  grade_level: string
  coordinatorship_ids: string[]
  major_ids: string[]
  subject_ids: string[]
  grade_levels: string[]
}

const PersonnelSubjects = ({ hideModal, employee }: ModalProps) => {
  const [saving, setSaving] = useState(false)

  const [subjects, setSubjects] = useState<SubjectTypes[] | []>([])
  const [gradeLevels, setGradeLevels] = useState<string[] | []>([])
  const [coordinatorships, setCoordinatorships] = useState<
    CoordinatorshipTypes[] | []
  >([])
  const [majors, setMajors] = useState<MajorTypes[] | []>([])

  const { supabase } = useSupabase()
  const { setToast } = useFilter()

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value)
  const dispatch = useDispatch()

  const { register, handleSubmit } = useForm<PersonnelFormTypes>({
    mode: 'onSubmit'
  })

  const onSubmit = async (formdata: PersonnelFormTypes) => {
    if (saving) return

    setSaving(true)

    try {
      // GRADE LEVEL
      await supabase
        .from('hrm_personnel_grade_levels')
        .delete()
        .eq('user_id', employee.id)
      await supabase.from('hrm_personnel_grade_levels').insert(
        formdata.grade_levels.map((level) => ({
          user_id: employee.id,
          grade_level: level
        }))
      )

      // SUBJECTS
      await supabase
        .from('hrm_personnel_subjects')
        .delete()
        .eq('user_id', employee.id)
      await supabase.from('hrm_personnel_subjects').insert(
        formdata.subject_ids.map((id) => ({
          user_id: employee.id,
          subject_id: id
        }))
      )

      // MAJORS
      await supabase
        .from('hrm_personnel_majors')
        .delete()
        .eq('user_id', employee.id)

      await supabase.from('hrm_personnel_majors').insert(
        formdata.major_ids.map((id) => ({
          user_id: employee.id,
          major_id: id
        }))
      )

      // COORDINATORSHIPS
      await supabase
        .from('hrm_personnel_coordinatorships')
        .delete()
        .eq('user_id', employee.id)

      await supabase.from('hrm_personnel_coordinatorships').insert(
        formdata.coordinatorship_ids.map((id) => ({
          user_id: employee.id,
          coordinatorship_id: id
        }))
      )

      // Update redux
      const items = [...globallist]
      const updatedData = {
        grade_levels: formdata.grade_levels.map((level: string) => ({
          id: level, // Generate or assign an ID if necessary
          user_id: employee.id,
          grade_level: level
        })),
        subjects: formdata.subject_ids.map((subject_id: string) => ({
          id: subject_id, // Generate or assign an ID if necessary
          user_id: employee.id,
          subject_id
        })),
        majors: formdata.major_ids.map((major_id: string) => ({
          id: major_id, // Generate or assign an ID if necessary
          user_id: employee.id,
          major_id
        })),
        coordinatorships: formdata.coordinatorship_ids.map(
          (coordinatorship_id: string) => ({
            id: coordinatorship_id, // Generate or assign an ID if necessary
            user_id: employee.id,
            coordinatorship_id
          })
        ),
        id: employee.id
      }

      const foundIndex = items.findIndex((x) => x.id === updatedData.id)
      items[foundIndex] = { ...items[foundIndex], ...updatedData }
      console.log(items)
      dispatch(updateList(items))

      // pop up the success message
      setToast('success', 'Successfully saved.')

      hideModal()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('hrm_subjects').select()
      if (data) {
        setSubjects(data)
      }
    }

    const fetchCoordinatorships = async () => {
      const { data } = await supabase.from('hrm_coordinatorships').select()
      if (data) {
        setCoordinatorships(data)
      }
    }
    const fetchMajors = async () => {
      const { data } = await supabase.from('hrm_majors').select()
      if (data) {
        setMajors(data)
      }
    }

    setGradeLevels([
      'Grade 1',
      'Grade 2',
      'Grade 3',
      'Grade 4',
      'Grade 5',
      'Grade 6',
      'Grade 7',
      'Grade 8',
      'Grade 9',
      'Grade 10',
      'Grade 11',
      'Grade 12'
    ])

    void fetchCoordinatorships()
    void fetchMajors()
    void fetchSubjects()
  }, [])

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Personnel Details</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <div className="app__modal_body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <div className="app__label_standard">Grade Levels</div>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-4 bg-white p-2 border">
                    {gradeLevels.map((lvl, index) => (
                      <label key={index} className="text-sm text-gray-700">
                        <input
                          type="checkbox"
                          value={lvl}
                          defaultChecked={employee.grade_levels.some(
                            (emp) => emp.grade_level === lvl
                          )}
                          {...register('grade_levels')}
                        />{' '}
                        {lvl}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="app__label_standard">Subjects</div>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-4 bg-white p-2 border">
                    {subjects.map((item, index) => (
                      <label key={index} className="text-sm text-gray-700">
                        <input
                          type="checkbox"
                          value={item.id}
                          defaultChecked={employee.subjects.some(
                            (subject) =>
                              subject.subject_id.toString() ===
                              item.id.toString()
                          )}
                          {...register('subject_ids')}
                        />{' '}
                        {item.title} - {item.category_level}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="app__label_standard">Majors</div>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-4 bg-white p-2 border">
                    {majors.map((item, index) => (
                      <label key={index} className="text-sm text-gray-700">
                        <input
                          type="checkbox"
                          value={item.id}
                          defaultChecked={employee.majors.some(
                            (major) =>
                              major.major_id.toString() === item.id.toString()
                          )}
                          {...register('major_ids')}
                        />{' '}
                        {item.title}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="app__label_standard">Coordinatorships</div>
                  <div className="grid gap-2 grid-cols-2 md:grid-cols-4 bg-white p-2 border">
                    {coordinatorships.map((item, index) => (
                      <label key={index} className="text-sm text-gray-700">
                        <input
                          type="checkbox"
                          value={item.id}
                          defaultChecked={employee.coordinatorships.some(
                            (coor) =>
                              coor.coordinatorship_id.toString() ===
                              item.id.toString()
                          )}
                          {...register('coordinatorship_ids')}
                        />{' '}
                        {item.title}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <button type="submit" className="app__btn_green_sm">
                    {saving ? 'Saving..' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PersonnelSubjects
