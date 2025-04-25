/* eslint-disable @typescript-eslint/no-non-null-assertion */
'use client'
import { Sidebar, Title, TopBar } from '@/components/index'
import RandRSidebar from '@/components/Sidebars/RandRSidebar'

export default function Page() {
  return (
    <>
      <Sidebar>
        <RandRSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div className="app__title">
          <Title title="Gawad Agad" />
        </div>
        <div className="p-4">
          <table className="app__table">
            <thead className="app__thead">
              <tr>
                <th className="app__th">Awards</th>
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
