import { clsx, type ClassValue } from 'clsx'
import { startOfDay } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Check if a CTO is expired based on expiration date vs today (not status field) */
export function isCtoExpired(expiration: string | Date | undefined): boolean {
  if (!expiration) return false
  const expDate = startOfDay(new Date(expiration))
  const today = startOfDay(new Date())
  return expDate < today
}
