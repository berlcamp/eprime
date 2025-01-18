import 'server-only'
import './globals.css'

import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PRIME-HRM',
  description: 'PRIME-HRM by BTC'
}

// do not cache this layout
export const revalidate = 0

export default async function RootLayout() {
  return (
    <html lang="en">
      <body className="relative bg-gray-100">
        <div className="app__home">
          <div className="bg-gray-700 h-screen pb-10 pt-32 px-6 md:flex items-start md:space-x-4 justify-center">
            <div className="md:w-[720px] md:max-w-[720px] space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg border ">
                The system is currently down for maintenance. We apologize for
                the inconvenience.
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
