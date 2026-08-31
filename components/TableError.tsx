'use client'

import CustomButton from './CustomButton'
import type { QueryError } from '@/utils/query-result'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

interface PropTypes {
  error: QueryError
  onRetry?: () => void
}

/**
 * Rendered in place of "No records found." when a fetch actually failed.
 *
 * The distinction matters: an empty table and a failed query used to look the
 * same, so a user could not tell "this employee has no CTOs" from "the query
 * errored." The technical cause stays on screen because support staff are the
 * ones who relay it, and they cannot read the browser console.
 */
export default function TableError({ error, onRetry }: PropTypes) {
  return (
    <div className="p-4 text-gray-700">
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <div className="text-lg">{error.message}</div>
          <div className="mt-1 font-mono text-xs text-gray-500">
            {error.cause}
          </div>
          {onRetry && (
            <div className="mt-3">
              <CustomButton
                containerStyles="app__btn_gray"
                title="Try again"
                btnType="button"
                handleClick={onRetry}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
