import * as React from 'react'

interface EmailTemplateProps {
  firstname: string
  middlename: string
  lastname: string
}

export const RegisteredTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstname,
  middlename,
  lastname
}) => {
  const header = `Dear ${firstname} ${middlename} ${lastname},`
  const body =
    'Congratulations! Your registration to PRIME-HRM system of DepEd Bayugan has been successfully approved. You can now log in using the email and password you submitted when you registered. Click this link to login and access your account: https://eprime.sortbrite.com'

  return (
    <div>
      <div>{header}</div>
      <br />
      <div>{body}</div>
    </div>
  )
}
