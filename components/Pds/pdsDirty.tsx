'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef
} from 'react'

type DirtyCheck = () => boolean

interface PdsDirtyContextType {
  setDirtyCheck: (check: DirtyCheck | null) => void
}

export const PdsDirtyContext = createContext<PdsDirtyContextType | null>(null)

/**
 * Each PDS tab is mounted only while it is the active one, so switching tabs
 * throws away anything the user typed but had not saved. The active tab reports
 * whether it holds unsaved work; the tab strip asks before unmounting it.
 */
export function usePdsDirtyRegistry() {
  const checkRef = useRef<DirtyCheck | null>(null)

  const contextValue = useMemo(
    () => ({
      setDirtyCheck: (check: DirtyCheck | null) => {
        checkRef.current = check
      }
    }),
    []
  )

  const isActiveTabDirty = useCallback(
    () => Boolean(checkRef.current?.()),
    []
  )

  return { contextValue, isActiveTabDirty }
}

/**
 * Called by every tab with a check for its own unsaved work.
 *
 * It takes a function rather than a boolean because react-hook-form inputs are
 * uncontrolled — typing into one triggers no re-render, so a boolean computed
 * during render would be stale by the time the user clicks another tab.
 */
export function useReportPdsDirty(isDirty: DirtyCheck) {
  const context = useContext(PdsDirtyContext)

  // Read through a ref so the registration itself never needs to change.
  const dirtyRef = useRef(isDirty)
  dirtyRef.current = isDirty

  useEffect(() => {
    if (!context) return

    context.setDirtyCheck(() => dirtyRef.current())

    return () => {
      context.setDirtyCheck(null)
    }
  }, [context])
}
