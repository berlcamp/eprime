import * as React from 'react'

interface EmailTemplateProps {
  header: React.ReactNode
  body: React.ReactNode
}

export const DisqualificationTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = ({ header, body }) => (
  <div>
    <div>{header}</div>
    <br />
    <div>{body}</div>
  </div>
)
