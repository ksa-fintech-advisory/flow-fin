import { useEffect, useState } from 'react'

/** Desktop orchestration workspace — full topology IDE layout. */
export const DESKTOP_MIN_PX = 1024

/** Tablet companion — adaptive layout with more canvas than phone. */
export const TABLET_MIN_PX = 768

export type DeviceClass = 'mobile' | 'tablet' | 'desktop'

function classifyWidth(width: number): DeviceClass {
  if (width >= DESKTOP_MIN_PX) return 'desktop'
  if (width >= TABLET_MIN_PX) return 'tablet'
  return 'mobile'
}

/**
 * Adaptive device class for orchestration UI.
 * Desktop keeps the full workspace; mobile/tablet use the runtime companion shell.
 */
export function useDeviceClass(): DeviceClass {
  const [deviceClass, setDeviceClass] = useState<DeviceClass>(() => {
    if (typeof window === 'undefined') return 'desktop'
    return classifyWidth(window.innerWidth)
  })

  useEffect(() => {
    const mqDesktop = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`)
    const mqTablet = window.matchMedia(`(min-width: ${TABLET_MIN_PX}px)`)

    const update = () => {
      if (mqDesktop.matches) setDeviceClass('desktop')
      else if (mqTablet.matches) setDeviceClass('tablet')
      else setDeviceClass('mobile')
    }

    update()
    mqDesktop.addEventListener('change', update)
    mqTablet.addEventListener('change', update)
    return () => {
      mqDesktop.removeEventListener('change', update)
      mqTablet.removeEventListener('change', update)
    }
  }, [])

  return deviceClass
}

export function isAdaptiveDevice(deviceClass: DeviceClass): boolean {
  return deviceClass !== 'desktop'
}
