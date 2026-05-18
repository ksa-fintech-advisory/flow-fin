import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const isDesktop = useViewportDesktop(minWidth)

  if (!isDesktop) {
    return (
      <div className="ff-desktop-gate">
        <div className="ff-desktop-gate__backdrop" aria-hidden />
        <div className="ff-desktop-gate__panel" role="alert">
          <FlowFinLogo size={36} title={SITE_NAME} />
          <h1>{t('desktopGate.title')}</h1>
          <p>{t('desktopGate.body', { brand: SITE_NAME })}</p>
          <ul className="ff-desktop-gate__reasons">
            <li>{t('desktopGate.reasonLayout')}</li>
            <li>{t('desktopGate.reasonPropagation')}</li>
            <li>{t('desktopGate.reasonInspector')}</li>
          </ul>
          <p className="ff-desktop-gate__hint">{t('desktopGate.hint')}</p>
        </div>
        </div>
    )
  }

  return <>{children}</>
}
