import { DocumentTypes } from '@/types'
import { format } from 'date-fns'
import * as React from 'react'

interface ComponentToPrintProps {
  selectedItem: DocumentTypes
}

export const PrintUndertimeForm = React.forwardRef<
  HTMLDivElement | null,
  ComponentToPrintProps
>((props, ref) => {
  const { selectedItem } = props

  return (
    <div className="invisible">
      <div ref={ref} className="w-[408px] bg-white py-2 px-1">
        <table className="w-full">
          <thead>
            <tr>
              <td colSpan={2} className="relative text-center">
                <div className="flex items-center justify-center">
                  <div className="">
                    <div className="text-xs">Republic of the Philippines</div>
                    <div className="">Department of Education</div>
                    <div className="text-xs">Division of Bayugan City</div>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className="text-center">
                <div className="font-bold text-xl py-4">UNDERTIME PERMIT</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="text-xs">
                  Date:{' '}
                  {format(new Date(selectedItem.created_at), 'MMMM d, yyyy')}
                </div>
                <div className="mt-4 text-xs">
                  The undersigned employee requests to leave the office today at{' '}
                  {selectedItem.undertime_permit_time}, for the following
                  reason/s:
                </div>
                <div className="mt-4 text-xs">
                  {selectedItem.undertime_permit_reason}
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    {selectedItem.creator?.signature_path ? (
                      <img
                        src={selectedItem.creator?.signature_path}
                        alt=""
                        width={75}
                        height={75}
                      />
                    ) : (
                      <span>SGD</span>
                    )}
                  </div>
                  <div className="font-bold border-t border-t-black">
                    {selectedItem.creator.lastname},{' '}
                    {selectedItem.creator.firstname}{' '}
                    {selectedItem.creator.middlename}
                  </div>
                  <div>Name of Employee</div>
                </div>
              </td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td>&nbsp;</td>
              <td>
                <div className="mt-6 text-xs">Approved:</div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    {selectedItem.approver?.signature_path ? (
                      <img
                        src={selectedItem.approver?.signature_path}
                        alt=""
                        width={75}
                        height={75}
                      />
                    ) : (
                      <span>SGD</span>
                    )}
                  </div>
                  <div className="font-bold border-t border-t-black">
                    {selectedItem.approver?.lastname},{' '}
                    {selectedItem.approver?.firstname}{' '}
                    {selectedItem.approver?.middlename}
                  </div>
                  <div>OIC / Schools Division Superintendent</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
})
