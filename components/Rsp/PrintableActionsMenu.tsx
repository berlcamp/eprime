'use client'

import { Menu } from '@headlessui/react'
import { EyeIcon, MailIcon, PrinterIcon } from 'lucide-react'

interface PrintableActionsMenuProps {
  onPrintAdviseOrder: () => void
  onPrintAssumption: () => void
  onPrintOathOfOffice: () => void
  onPrintAppointmentForm: () => void
  onViewCommitteePoints?: () => void
  showViewCommitteePoints?: boolean
  onResendAppointmentEmail?: () => void
  /** Super admin only — resends the congratulations email to the appointee */
  showResendAppointmentEmail?: boolean
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
  onPrintAppointmentForm,
  onViewCommitteePoints,
  showViewCommitteePoints = false,
  onResendAppointmentEmail,
  showResendAppointmentEmail = false,
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
          <Menu.Item>
            <div
              onClick={onPrintAppointmentForm}
              className="app__dropdown_item space-x-2"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Appointment Form</span>
            </div>
          </Menu.Item>
          {showResendAppointmentEmail && onResendAppointmentEmail && (
            <Menu.Item>
              <div
                onClick={onResendAppointmentEmail}
                className="app__dropdown_item space-x-2"
              >
                <MailIcon className="w-4 h-4" />
                <span>Resend Congratulations Email</span>
              </div>
            </Menu.Item>
          )}
        </>
      )}
    </div>
  )
}
