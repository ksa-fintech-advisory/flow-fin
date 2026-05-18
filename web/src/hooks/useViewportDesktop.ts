import { useEffect, useState } from 'react'

/** Minimum viewport width for the orchestration playground. */
export const PLAYGROUND_DESKTOP_MIN_PX = 1024

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
