'use client'
import React from 'react'
import uuid from 'react-uuid'

const generatePageNumbers = (totalPages: number, currentPage: number) => {
  const pages = []

  // add the current page and the surrounding pages
  if (currentPage > 3 && currentPage < totalPages - 2) {
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      pages.push(i)
    }
  } else {
    for (let i = 2; i <= 4 && i <= totalPages - 1; i++) {
      pages.push(i)
    }
  }

  // add the first five page numbers
  const max = totalPages > 5 ? 5 : totalPages
  for (let i = 1; i <= max; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // add the last five page numbers
  for (let i = totalPages - 4; i <= totalPages; i++) {
    if (i > 1) {
      pages.push(i)
    }
  }

  const uniqueArray = pages.filter(
    (value, index, self) => self.indexOf(value) === index
  )
  return uniqueArray.sort((a, b) => a - b)
}
interface CompProps {
  currentPage: number
  handleChangePage: (page: number) => void
  totalResults: number
  perPage: number
}
export default function PaginationNumbers({
  currentPage,
  handleChangePage,
  totalResults,
  perPage
}: CompProps) {
  const totalPages = Math.ceil(totalResults / perPage)

  if (totalPages <= 1) return

  const pages = generatePageNumbers(totalPages, currentPage)

  return (
    <div className="py-2 px-4 bg-gray-50 text-gray-500 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-400">
      {pages.map((page, index) => (
        <React.Fragment key={uuid()}>
          <span>{pages[index] - pages[index - 1] > 1 && '....'}</span>
          <span
            onClick={() => handleChangePage(page)}
            className={`${
              page === currentPage
                ? 'bg-gray-400 text-gray-50'
                : 'bg-gray-200 text-gray-600'
            } inline-flex mx-1 mb-2 px-2 py-1 text-sm border rounded-sm cursor-pointer`}
          >
            {page}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}
