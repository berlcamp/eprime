import { CustomButton } from '@/components/index'
import { useSupabase } from '@/context/SupabaseProvider'
import { CtoUserTypes } from '@/types'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Remarks({ cto }: { cto: CtoUserTypes }) {
  const [remark, setRemark] = useState(cto.remarks ?? '')
  const { supabase } = useSupabase()
  const handleAddRemarks = async () => {
    if (remark !== cto.remarks) {
      const { error } = await supabase
        .from('hrm_cto_users')
        .update({
          remarks: remark
        })
        .eq('id', cto.id)
      if (!error) {
        // insert to notifications
        await supabase.from('hrm_notifications').insert({
          message: 'Remarks has been added to your <b>CTO</b>.',
          url: `/profile/${cto.hrm_user_id}?page=ctos&id=${cto.id}`,
          type: 'cto',
          user_id: cto.hrm_user_id,
          cto_user_id: cto.id,
          reference_table: 'hrm_cto_users'
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
