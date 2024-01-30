import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { type Employee } from '@/types'

// Mailgun stuff
import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import { logError } from '@/utils/fetchApi'

export async function POST (req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { item }: { item: Employee } = await req.json()

    // Signup to supabase auth system
    const { data: signUpData, error } = await supabase.auth.admin.createUser({
      email: item.email,
      password: item.password,
      email_confirm: true
    })

    if (error) {
      void logError('Signup to supabase auth system on registration approval', 'auth.users', '', error.message)
      throw new Error(error.message)
    }

    const newUser: any = signUpData

    // Check if exist on registration data before redirecting to main page
    const { error: hrmUserError } = await supabase
      .from('hrm_users')
      .upsert({
        id: newUser.user.id,
        firstname: item.firstname,
        middlename: item.middlename,
        lastname: item.lastname,
        gender: item.gender,
        assignment: item.assignment,
        school_id: item.school_id ? item.school_id : null,
        district_id: item.district_id ? item.district_id : null,
        office_id: item.office_id ? item.office_id : null,
        org_id: item.org_id,
        email: item.email,
        status: 'Active'
      }, { onConflict: 'id' })

    if (hrmUserError) {
      void logError('Add user on registration approval', 'hrm_users', '', hrmUserError.message)
      throw new Error('hrmUserError' + hrmUserError.message)
    }

    // Update registration data
    const { error: updateRegistrationError } = await supabase
      .from('hrm_registrations')
      .delete()
      .eq('id', item.id)

    if (updateRegistrationError) {
      void logError('Delete registration record after approval', 'hrm_registrations', '', updateRegistrationError.message)
      throw new Error('hrmUserError' + updateRegistrationError.message)
    }

    let leaveCardData
    if (item.gender === 'Male') {
      leaveCardData = [{
        type: 'Paternity Leave',
        balance: 7,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Paternity Leave Adjustment'
      },
      {
        type: 'Special Privilege Leave',
        balance: 3,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Special Privilege Leave Adjustment'
      },
      {
        type: 'Rehabilitation Leave',
        balance: 180,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Rehabilitation Leave Adjustment'
      }]
    } else {
      leaveCardData = [{
        type: 'Maternity Leave',
        balance: 105,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Maternity Leave Adjustment'
      },
      {
        type: 'Special Privilege Leave',
        balance: 3,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Special Privilege Leave Adjustment'
      },
      {
        type: 'Rehabilitation Leave',
        balance: 180,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Rehabilitation Leave Adjustment'
      },
      {
        type: 'Special Leave Benefits For Women',
        balance: 60,
        remarks: 'Auto added to system after signup, adjust accordingly',
        user_id: newUser.user.id,
        particulars: 'Special Leave Benefits For Women Adjustment'
      }]
    }

    // Generate default leave credit values for all leave types expect SL, VL, COC, SC
    const { error: error3 } = await supabase
      .from('hrm_leave_cards')
      .insert(leaveCardData)

    if (error3) {
      void logError('Auto add leave card record on registration approval', 'hrm_leave_cards', '', error3.message)
      throw new Error(error3.message)
    }

    // Mailgun stuff
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: process.env.NEXT_PUBLIC_MAILGUN_KEY ?? '' })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://primehrm.sortbrite.com/'
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'PRIME-HRM'
    let emailMessage = `Hello ${item.firstname} ${item.middlename} ${item.lastname},`
    emailMessage += `<p>Welcome to ${appName}`
    emailMessage += `<p>Your registration to ${appName} has been approved. You can now login with your email and password using the link below.</p>`
    emailMessage += `<a href="${baseUrl}">${baseUrl}</a>`
    emailMessage += '<p>Have a great day!</p>'
    emailMessage += '<br><p>This is a system generated message, please do not reply.</p>'

    mg.messages.create('hrmprime.com', {
      from: `${appName} (No-reply) <mailgun@sandbox-123.mailgun.org>`,
      to: [item.email],
      subject: 'PRIME-HRM Registration Approved',
      text: emailMessage,
      html: emailMessage
    })
      .then(msg => console.log(msg)) // logs response data
      .catch(err => {
        // logs any error
        void logError('Auto add leave card record on registration approval', 'hrm_leave_cards', '', JSON.stringify(err))
      })

    return NextResponse.json({ message: 'Successfully approved' })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error })
  }
}
