import ProfileList from './ProfileList'
import Image from 'next/image'

interface propTypes {
  id: number
  name: string
  role: string
  type?: string
  profiles?: any[] | []
}

const ProfileCard = ({ id, name, role, type, profiles = [] }: propTypes) => {
  return (
    <div className="text-center">
      <div className="flex flex-col justify-center items-center">
        {
          type !== 'office' &&
            <div className="w-16">
              <Image
                className="block rounded-full m-auto shadow-md"
                alt={name}
                width={64}
                height={64}
                src={`https://randomuser.me/api/portraits/men/${id}.jpg`}
              />
            </div>
        }
        <div className="text-gray-600">
          {
            type !== 'office'
              ? <div>{name}</div>
              : <div className='p-2 border-2 border-gray-500'>{name}</div>
          }
          {
            type !== 'office' &&
              <p>{role}</p>
          }
        </div>
      </div>
      {profiles.length > 0 && <ProfileList profiles={profiles} />}
    </div>
  )
}

export default ProfileCard
