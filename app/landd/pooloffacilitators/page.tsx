/* eslint-disable @typescript-eslint/no-non-null-assertion */
'use client'
import { Sidebar, Title, TopBar } from '@/components/index'
import LandDSidebar from '@/components/Sidebars/LandDSidebar'

export default function Page() {
  return (
    <>
      <Sidebar>
        <LandDSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div className="app__title">
          <Title title="Pool of Learning Facilitators" />
        </div>
        <div className="p-4">
          <table className="app__table">
            <thead className="app__thead">
              <tr>
                <th className="app__th">Facilitator</th>
                <th className="app__th">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="app__tr">
                <td className="app__td" colSpan={2}>
                  No record found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
