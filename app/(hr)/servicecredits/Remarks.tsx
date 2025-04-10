import { CustomButton } from '@/components'
import { useSupabase } from '@/context/SupabaseProvider'
import { ServiceCreditUserTypes } from '@/types'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Remarks({ sc }: { sc: ServiceCreditUserTypes }) {
  const [remark, setRemark] = useState(sc.remarks ?? '')
  const { supabase } = useSupabase()
  const handleAddRemarks = async () => {
    if (remark !== sc.remarks) {
      const { error } = await supabase
        .from('hrm_service_credit_users')
        .update({
          remarks: remark
        })
        .eq('id', sc.id)
      if (!error) {
        // insert to notifications
        await supabase.from('hrm_notifications').insert({
          message: 'Remarks has been added to your <b>Service Credit</b>.',
          url: `/profile/${sc.hrm_user_id}?page=servicecredits&id=${sc.id}`,
          type: 'service_credit_users',
          user_id: sc.hrm_user_id,
          service_credit_user_id: sc.id,
          reference_table: 'hrm_service_credit_users'
        })
        toast.success('Remarks saved')
      }
    }
  }

  return (
    <div className="space-y-1">
      <input
        type="text"
        className="app__input_standard"
        placeholder="Add remarks"
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
      />
      <CustomButton
        containerStyles="app__btn_blue_xs"
        title="Add Remarks"
        handleClick={handleAddRemarks}
      />
    </div>
  )
}
