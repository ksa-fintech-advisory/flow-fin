import { useEffect, useState } from 'react'
import { DESKTOP_MIN_PX } from './useDeviceClass'

/** Minimum viewport width for the orchestration playground. */
export const PLAYGROUND_DESKTOP_MIN_PX = DESKTOP_MIN_PX

export function useViewportDesktop(minWidth = PLAYGROUND_DESKTOP_MIN_PX): boolean {
  const query = `(min-width: ${minWidth}px)`

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return isDesktop
}
