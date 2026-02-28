'use client'

import { Menu } from '@headlessui/react'
import { EyeIcon, PrinterIcon } from 'lucide-react'

interface PrintableActionsMenuProps {
  onPrintAdviseOrder: () => void
  onPrintAssumption: () => void
  onPrintOathOfOffice: () => void
  onViewCommitteePoints?: () => void
  showViewCommitteePoints?: boolean
  /** Only show print actions when applicant is appointed */
  isAppointed?: boolean
}

/**
 * Shared printable actions dropdown menu for ranking results and ranking appointees.
 * Use the same component on both /rankingresults and /rankingappointees pages.
 */
export function PrintableActionsMenu({
  onPrintAdviseOrder,
  onPrintAssumption,
  onPrintOathOfOffice,
  onViewCommitteePoints,
  showViewCommitteePoints = false,
  isAppointed = true,
}: PrintableActionsMenuProps) {
  return (
    <div className="py-1">
      {showViewCommitteePoints && onViewCommitteePoints && (
        <Menu.Item>
          <div
            onClick={onViewCommitteePoints}
            className="app__dropdown_item"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View Committee Points</span>
          </div>
        </Menu.Item>
      )}
      {isAppointed && (
        <>
          <Menu.Item>
            <div
              onClick={onPrintAdviseOrder}
              className="app__dropdown_item space-x-2"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Advise Order</span>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div
              onClick={onPrintAssumption}
              className="app__dropdown_item space-x-2"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Assumption to Duty</span>
            </div>
          </Menu.Item>
          <Menu.Item>
            <div
              onClick={onPrintOathOfOffice}
              className="app__dropdown_item space-x-2"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Oath of Office</span>
            </div>
          </Menu.Item>
        </>
      )}
    </div>
  )
}
