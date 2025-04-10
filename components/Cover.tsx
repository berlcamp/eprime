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

      {/* Profile Info */}
      <div className="absolute top-10 left-10 flex space-x-4 items-center justify-center">
        <div className="w-32 h-32 border-4 border-white rounded-full overflow-hidden">
          <Image
            src="/logos/deped.png"
            alt="Deped"
            width={200}
            height={200}
            className="opacity-90"
          />
        </div>
        <div className="w-32 h-32">
          <Image
            src="/logos/bagong.png"
            alt="Deped"
            width={200}
            height={200}
            className="opacity-90"
          />
        </div>
        <div className="w-32 h-32">
          <Image
            src="/logos/bayugan.png"
            alt="Deped"
            width={200}
            height={200}
            className="opacity-90"
          />
        </div>
      </div>
    </div>
  )
}
