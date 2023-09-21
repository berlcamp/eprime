'use client'
import React from 'react'
import Image from 'next/image'
import Avatar from 'react-avatar'
import { capitalizeWords } from '@/utils/text-helper'

// types
import type { Employee } from '@/types'

interface PropTypes {
  user: Employee
}

const UserBlock = ({ user }: PropTypes) => {
  return (
    <div className='flex items-center space-x-1'>
      {
        (user.avatar_url && user.avatar_url !== '')
          ? <div className='w-7 h-7 relative rounded-full flex items-center justify-center bg-black overflow-hidden'>
              <Image src={user.avatar_url} width={40} height={40} alt='user'/>
            </div>
          : <Avatar round={true} size="30" name={user.firstname}/>
      }
      <div className='font-medium'>{capitalizeWords(user.firstname)} {capitalizeWords(user.middlename)} {capitalizeWords(user.lastname)}</div>
    </div>
  )
}
export default UserBlock
