import type { ReactNode } from 'react'
import { FlowFinLogo } from '../brand/FlowFinLogo'
import { SITE_NAME } from '../brand/site'
import { useViewportDesktop } from '../hooks/useViewportDesktop'

type DesktopRequiredGateProps = {
  children: ReactNode
  minWidth?: number
}

/**
 * Blocks orchestration UI on viewports too small for topology work.
 * Shows an intentional fullscreen message instead of a broken graph layout.
 */
export function DesktopRequiredGate({ children, minWidth }: DesktopRequiredGateProps) {
  const isDesktop = useViewportDesktop(minWidth)

  if (!isDesktop) {
    return (
      <div className="ff-desktop-gate">
        <div className="ff-desktop-gate__backdrop" aria-hidden />
        <div className="ff-desktop-gate__panel" role="alert">
          <FlowFinLogo size={36} title={SITE_NAME} />
          <h1>Desktop environment required</h1>
          <p>
            {SITE_NAME} currently requires a desktop environment for the best orchestration and
            topology experience.
          </p>
          <ul className="ff-desktop-gate__reasons">
            <li>Graph readability and ELK layout</li>
            <li>Runtime propagation visualization</li>
            <li>Node inspector and operational tracing</li>
          </ul>
          <p className="ff-desktop-gate__hint">
            Widen your browser window or open this scenario on a laptop or desktop display.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
