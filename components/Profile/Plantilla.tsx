'use client'

import { useSupabase } from '@/context/SupabaseProvider'
import { ItemTypes } from '@/types'
import { useEffect, useState } from 'react'
import TwoColTableLoading from '../Loading/TwoColTableLoading'
import Title from '../Title'

export default function Plantilla({ userId }: { userId: string }) {
  const [item, setItem] = useState<ItemTypes | null>(null)
  const [loading, setLoading] = useState(true)
  const { supabase } = useSupabase()
  useEffect(() => {
    const fetchItemData = async () => {
      const { data } = await supabase
        .from('hrm_items')
        .select(
          '*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),hrm_school:school_id(name),implementing_unit:implementing_unit_id(name),hrm_position:position_id(name)',
          { count: 'exact' }
        )
        .eq('user_id', userId)
        .maybeSingle()

      if (data) {
        setItem(data)
      }
      setLoading(false)
    }

    void fetchItemData()
  }, [item])

  if (loading) {
    return (
      <div>
        <div className="app__title">
          <Title title="Plantilla Details" />
        </div>
        <div className="w-full mx-4 mt-4">
          <TwoColTableLoading />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div>
        <div className="app__title">
          <Title title="Plantilla Details" />
        </div>
        <div className="w-full mx-4 mt-4">
          <div className="text-sm text-gray-500">
            <div className="mb-2 text-xl">
              Employee currently not assigned to a plantilla item.
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <div>
        <div className="app__title">
          <Title title="Plantilla Details" />
        </div>

        {/* Main Content */}
        <div className="w-full mx-4 mt-4">
          <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
            {/* Begin First Column */}
            <div className="w-full px-4">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Item No:</div>
                  <div className="app__label_value">{item.item_number}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Position:</div>
                  <div className="app__label_value">
                    {item.hrm_position?.name}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Implementing Unit:</div>
                  <div className="app__label_value">
                    {item.implementing_unit?.name}
                  </div>
                </div>
              </div>
            </div>

            {/* End First Column */}
            {/* Begin Second Column */}
            <div className="w-full px-4">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Assigned To</div>
                  <div className="app__label_value">
                    {item.hrm_school?.name}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Vice:</div>
                  <div className="app__label_value">{item.vice}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Sex:</div>
                  <div className="app__label_value">{item.sex}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Date of Birthday:</div>
                  <div className="app__label_value">{item.birthday}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Civil Service Eligibility:
                  </div>
                  <div className="app__label_value">{item.eligibility}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Date of Promotion:</div>
                  <div className="app__label_value">
                    {item.date_of_last_promotion}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Date of Original Appointment:
                  </div>
                  <div className="app__label_value">
                    {item.date_of_original_appointment}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Status:</div>
                  <div className="app__label_value">{item.status}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Authorized Annual Salary:
                  </div>
                  <div className="app__label_value">
                    {item.actual_annual_salary}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Actual Annual Salary:
                  </div>
                  <div className="app__label_value">
                    {item.actual_annual_salary}
                  </div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Area Code:</div>
                  <div className="app__label_value">{item.area_code}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Area Type:</div>
                  <div className="app__label_value">{item.area_type}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Level:</div>
                  <div className="app__label_value">{item.level}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">TIN No:</div>
                  <div className="app__label_value">{item.tin_no}</div>
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">UMID No:</div>
                  <div className="app__label_value">{item.umid_no}</div>
                </div>
              </div>
            </div>
            {/* End Second Column */}
          </div>
        </div>
      </div>
    </>
  )
}
