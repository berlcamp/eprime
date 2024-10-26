'use client'
import Image from 'next/image'
import Avatar from 'react-avatar'

// types
import type { Employee } from '@/types'
import { capitalizeWords } from '@/utils/text-helper'

interface PropTypes {
  user: Employee
}

const UserBlock = ({ user }: PropTypes) => {
  if (!user) return

  return (
    <div className="flex items-center space-x-1">
      {user.avatar_url && user.avatar_url !== '' ? (
        <div className="relative  w-6 h-6 rounded-full flex items-center justify-center bg-black overflow-hidden">
          <Image src={user.avatar_url} width={20} height={20} alt="user" />
        </div>
      ) : (
        <Avatar round={true} size="20" name={user.firstname} />
      )}
      <div className="font-medium">
        {capitalizeWords(
          `${user.firstname} ${user.middlename} ${user.lastname}`
        )}
      </div>
    </div>
  )
}
export default UserBlock
