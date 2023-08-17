import React from 'react'
import uuid from 'react-uuid'

export default function OneColLayoutLoading ({ rows }: { rows: number }) {
  const tr: any = []
  for (let i = 0; i < rows; i++) {
    tr.push(i)
  }

  return (
    <div className="animate-pulse mx-2 my-2">
      {
        tr.map(() => (
          <div key={uuid()} className="grid grid-cols-1 gap-4 my-4">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
          </div>
        ))
      }
    </div>
  )
}
