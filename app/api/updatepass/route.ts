import { logError } from '@/utils/fetchApi'
import { createClient } from '@supabase/supabase-js'

import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { user_id, new_password }: { user_id: string; new_password: string } =
      await req.json()

    // Update the password for the user
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      password: new_password
    })

    if (error) {
      void logError('Update user password', 'auth.users', '', error.message)
      throw new Error(error.message)
    }

    return NextResponse.json({ message: 'Successfully updated' })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error })
  }
}
