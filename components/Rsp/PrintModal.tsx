'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PrinterIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onConfirm: () => void
  confirmLabel?: string
  confirmDisabled?: boolean
  validationError?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PrintModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  confirmLabel = 'Print',
  confirmDisabled = false,
  validationError,
  size = 'md',
}: PrintModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'gap-0 overflow-hidden p-0 sm:max-w-[95vw]',
          sizeClasses[size]
        )}
      >
        <DialogHeader className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 pr-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <PrinterIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-800">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-0.5 text-sm text-slate-500">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">{children}</div>

        {validationError && (
          <div className="mx-6 mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {validationError}
          </div>
        )}

        <DialogFooter className="border-t border-slate-200 bg-slate-50/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <PrinterIcon className="h-4 w-4" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
