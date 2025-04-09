import Image from 'next/image'

export default function Cover() {
  return (
    <div className="app__coverphoto_container relative">
      {/* Cover Photo */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <Image
          src="/cover.jpg"
          alt="Cover Photo"
          layout="fill"
          objectFit="cover"
          objectPosition="center"
          className="w-full h-full"
        />
      </div>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-50" />
    </div>
  )
}
