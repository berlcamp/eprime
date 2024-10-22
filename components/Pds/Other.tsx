import { useFilter } from '@/context/FilterContext'
import { useSupabase } from '@/context/SupabaseProvider'
import { logError } from '@/utils/fetchApi'
import { nanoid } from 'nanoid'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import CustomButton from '../CustomButton'
import TwoColTableLoading from '../Loading/TwoColTableLoading'

interface SkillsRowTypes {
  nanoid: string
  title: string
}
interface NonAcademicRowTypes {
  nanoid: string
  title: string
}
interface MembershipRowTypes {
  nanoid: string
  title: string
}

interface OtherInformationTypes {
  special_skills: string
  non_academic_distinctions: string
  membership_association: string
  confirmed: string
}

export default function Other({ userId }: { userId: string }) {
  const { supabase, session } = useSupabase()
  const { setToast } = useFilter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [skillsArray, setSkillsArray] = useState<SkillsRowTypes[] | []>([])
  const [nonAcademicArray, setNonAcademicArray] = useState<
    NonAcademicRowTypes[] | []
  >([])
  const [membershipArray, setMembershipArray] = useState<
    MembershipRowTypes[] | []
  >([])

  const [showAddSkill, setShowAddSkill] = useState(false)
  const [showAddNonAcademic, setShowAddNonAcademic] = useState(false)
  const [showAddMembership, setShowAddMembership] = useState(false)

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit
  } = useForm<SkillsRowTypes>({
    mode: 'onSubmit'
  })

  const {
    register: register2,
    formState: { errors: errors2 },
    reset: reset2,
    handleSubmit: handleSubmit2
  } = useForm<NonAcademicRowTypes>({
    mode: 'onSubmit'
  })

  const {
    register: register3,
    formState: { errors: errors3 },
    reset: reset3,
    handleSubmit: handleSubmit3
  } = useForm<MembershipRowTypes>({
    mode: 'onSubmit'
  })

  const {
    register: register4,
    formState: { errors: errors4 },
    handleSubmit: handleSubmit4
  } = useForm<OtherInformationTypes>({
    mode: 'onSubmit'
  })

  const onSubmitSkill = async (formdata: SkillsRowTypes) => {
    setSkillsArray([
      {
        nanoid: nanoid(),
        title: formdata.title
      },
      ...skillsArray
    ])

    reset()
    setShowAddSkill(false)
  }
  const onSubmitNonAcademic = async (formdata: SkillsRowTypes) => {
    setNonAcademicArray([
      {
        nanoid: nanoid(),
        title: formdata.title
      },
      ...nonAcademicArray
    ])

    reset2()
    setShowAddNonAcademic(false)
  }
  const onSubmitMembership = async (formdata: SkillsRowTypes) => {
    setMembershipArray([
      {
        nanoid: nanoid(),
        title: formdata.title
      },
      ...membershipArray
    ])

    reset3()
    setShowAddMembership(false)
  }

  const onSubmit = async () => {
    if (saving) return

    setSaving(true)

    // Upsert the database to database
    const newData = {
      user_id: userId,
      special_skills: skillsArray,
      non_academic_distinctions: nonAcademicArray,
      membership_association: membershipArray
    }

    const { error } = await supabase
      .from('hrm_pds')
      .upsert(newData, { onConflict: 'user_id' })

    if (error) {
      void logError(
        'Update Other information PDS',
        'hrm_pds',
        JSON.stringify(newData),
        error.message
      )
      setToast('error', 'Saving failed, please reload the page and try again.')
    } else {
      setToast('success', 'Successfully saved.')
    }

    setSaving(false)
  }

  const fetchData = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('hrm_pds')
      .select()
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (data) {
      // transfer the children json to state
      if (data.special_skills) {
        setSkillsArray(data.special_skills)
      }
      if (data.non_academic_distinctions) {
        setNonAcademicArray(data.non_academic_distinctions)
      }
      if (data.membership_association) {
        setMembershipArray(data.membership_association)
      }
    }

    if (error) console.log(error.message)

    setLoading(false)
  }

  const HandleRemoveSkill = (item: SkillsRowTypes) => {
    const updatedData = skillsArray.filter((e) => e.nanoid !== item.nanoid)
    setSkillsArray(updatedData)
  }
  const HandleRemoveNonAcademic = (item: NonAcademicRowTypes) => {
    const updatedData = nonAcademicArray.filter((e) => e.nanoid !== item.nanoid)
    setNonAcademicArray(updatedData)
  }
  const HandleRemoveMembership = (item: MembershipRowTypes) => {
    const updatedData = membershipArray.filter((e) => e.nanoid !== item.nanoid)
    setMembershipArray(updatedData)
  }

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <div className="w-full">
      {loading && <TwoColTableLoading />}
      {!loading && (
        <div className="w-full">
          <div className="w-full px-4">
            <div className="flex items-center">
              <div className="flex-grow bg-gray-300 h-px"></div>
              <div className="mx-4 my-4 text-gray-500 text-sm">
                Special Skills and Hobbies
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {skillsArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">Special Skills and Hobbies</th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillsArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">{item.title}</td>
                        <td className="app__td">
                          {userId === session.user.id && (
                            <CustomButton
                              containerStyles="app__btn_red"
                              title="Remove"
                              btnType="button"
                              handleClick={() => HandleRemoveSkill(item)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {userId === session.user.id && (
            <>
              <div className="app__pds_add_row_container">
                <form
                  onSubmit={handleSubmit(onSubmitSkill)}
                  className="text-xs"
                >
                  {!showAddSkill ? (
                    <CustomButton
                      containerStyles="app__btn_blue"
                      title="Add Special Skill and Hobby"
                      btnType="button"
                      handleClick={() => setShowAddSkill(true)}
                    />
                  ) : (
                    <div className="w-2/3 space-y-4">
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Special Skills and Hobbies:
                        </div>
                        <input
                          {...register('title', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.title && (
                          <div className="app__error_message">
                            Special Skills and Hobbies is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full space-x-2">
                        <CustomButton
                          containerStyles="app__btn_green"
                          title="Add"
                          btnType="submit"
                        />
                        <CustomButton
                          containerStyles="app__btn_gray"
                          title="Cancel"
                          btnType="button"
                          handleClick={() => setShowAddSkill(false)}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
          <hr className="my-6 mx-4" />
          <div className="w-full px-4">
            <div className="flex items-center">
              <div className="flex-grow bg-gray-300 h-px"></div>
              <div className="mx-4 my-4 text-gray-500 text-sm">
                NON-ACADEMIC DISTINCTIONS / RECOGNITION{' '}
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {nonAcademicArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">
                        NON-ACADEMIC DISTINCTIONS / RECOGNITION{' '}
                      </th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonAcademicArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">{item.title}</td>
                        <td className="app__td">
                          {userId === session.user.id && (
                            <CustomButton
                              containerStyles="app__btn_red"
                              title="Remove"
                              btnType="button"
                              handleClick={() => HandleRemoveNonAcademic(item)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {userId === session.user.id && (
            <>
              <div className="app__pds_add_row_container">
                <form
                  onSubmit={handleSubmit2(onSubmitNonAcademic)}
                  className="text-xs"
                >
                  {!showAddNonAcademic ? (
                    <CustomButton
                      containerStyles="app__btn_blue"
                      title="Add Non-Academic Distinction / Recognation"
                      btnType="button"
                      handleClick={() => setShowAddNonAcademic(true)}
                    />
                  ) : (
                    <div className="w-2/3 space-y-4">
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          Non-Academic Distinction / Recognation{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register2('title', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors2.title && (
                          <div className="app__error_message">
                            Non-Academic Distinction / Recognation is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full space-x-2">
                        <CustomButton
                          containerStyles="app__btn_green"
                          title="Add"
                          btnType="submit"
                        />
                        <CustomButton
                          containerStyles="app__btn_gray"
                          title="Cancel"
                          btnType="button"
                          handleClick={() => setShowAddNonAcademic(false)}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
          <hr className="my-6 mx-4" />
          <div className="w-full px-4">
            <div className="flex items-center">
              <div className="flex-grow bg-gray-300 h-px"></div>
              <div className="mx-4 my-4 text-gray-500 text-sm">
                MEMBERSHIP IN ASSOCIATION/ORGANIZATION{' '}
              </div>
              <div className="flex-grow bg-gray-300 h-px"></div>
            </div>
            <div className="w-full">
              {membershipArray.length > 0 && (
                <table className="app__table mb-4">
                  <thead className="app__thead">
                    <tr>
                      <th className="app__th">
                        MEMBERSHIP IN ASSOCIATION/ORGANIZATION{' '}
                      </th>
                      <th className="app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {membershipArray.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="app__td">{item.title}</td>
                        <td className="app__td">
                          {userId === session.user.id && (
                            <CustomButton
                              containerStyles="app__btn_red"
                              title="Remove"
                              btnType="button"
                              handleClick={() => HandleRemoveMembership(item)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {userId === session.user.id && (
            <>
              <div className="app__pds_add_row_container">
                <form
                  onSubmit={handleSubmit3(onSubmitMembership)}
                  className="text-xs"
                >
                  {!showAddMembership ? (
                    <CustomButton
                      containerStyles="app__btn_blue"
                      title="Add Non-Academic Distinction / Recognation"
                      btnType="button"
                      handleClick={() => setShowAddMembership(true)}
                    />
                  ) : (
                    <div className="w-2/3 space-y-4">
                      <div className="mb-2 w-full">
                        <div className="app__label_standard">
                          MEMBERSHIP IN ASSOCIATION/ORGANIZATION{' '}
                          <span className="text-gray-500 text-[11px]">
                            (Write in full)
                          </span>
                          :
                        </div>
                        <input
                          {...register3('title', { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors3.title && (
                          <div className="app__error_message">
                            This is required
                          </div>
                        )}
                      </div>
                      <div className="mb-2 w-full space-x-2">
                        <CustomButton
                          containerStyles="app__btn_green"
                          title="Add"
                          btnType="submit"
                        />
                        <CustomButton
                          containerStyles="app__btn_gray"
                          title="Cancel"
                          btnType="button"
                          handleClick={() => setShowAddMembership(false)}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
          {userId === session.user.id && (
            <>
              <hr className="my-6 mx-4" />
              <form onSubmit={handleSubmit4(onSubmit)} className="w-full">
                <div className="w-full px-4">
                  <div className="app__label_standard">
                    <label className="flex items-center space-x-1">
                      <input
                        {...register4('confirmed', { required: true })}
                        type="checkbox"
                        className=""
                      />
                      <span className="font-normal text-xs">
                        By checking this box, you acknowledge that all
                        information is accurate and up-to-date.
                      </span>
                    </label>
                    {errors4.confirmed && (
                      <div className="app__error_message">
                        Confirmation is required
                      </div>
                    )}
                  </div>
                </div>
                <div className="app__modal_footer_left mx-4 mt-4">
                  <button type="submit" className="app__btn_green_sm">
                    {saving ? 'Saving..' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
