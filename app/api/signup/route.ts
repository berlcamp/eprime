import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { type Employee } from '@/types'

// Mailgun stuff
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

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
    console.log('signUpData', signUpData)
    if (error) throw new Error(error.message)

    const newUser: any = signUpData

    // Check if exist on registration data before redirecting to main page
    const { error: hrmUserError } = await supabase
      .from('hrm_users')
      .upsert({
        id: newUser.user.id,
        firstname: item.firstname,
        middlename: item.middlename,
        lastname: item.lastname,
        assignment: item.assignment,
        school_id: item.school_id ? item.school_id : null,
        district_id: item.district_id ? item.district_id : null,
        office_id: item.office_id ? item.office_id : null,
        org_id: item.org_id,
        email: item.email,
        status: 'Active'
      }, { onConflict: 'id' })

    if (hrmUserError) throw new Error('hrmUserError' + hrmUserError.message)

    // Update registration data
    const { error: updateRegistrationError } = await supabase
      .from('hrm_registrations')
      .update({ status: 'Approved' })
      .eq('id', item.id)

    if (updateRegistrationError) throw new Error(updateRegistrationError.message)

    // Mailgun stuff
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({ username: 'api', key: process.env.NEXT_PUBLIC_MAILGUN_KEY ?? '' })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://deped.hrmprime.com/'
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'PRIME-HRM'
    let emailMessage = `Hello ${item.firstname} ${item.middlename} ${item.lastname},`
    emailMessage += `<p>Welcome to ${appName}`
    emailMessage += `<p>Your registration to ${appName} has been approved. You can now login using your username/email and password using the link below.</p>`
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
      .catch(err => console.error(err)) // logs any error

    return NextResponse.json({ message: 'Successfully approved' })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error })
  }
}
