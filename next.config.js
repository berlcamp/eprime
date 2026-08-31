/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me'
      },
      {
        protocol: 'https',
        hostname: 'nuhirhfevxoonendpfsm.supabase.co'
      }
    ]
  }
}

module.exports = nextConfig
