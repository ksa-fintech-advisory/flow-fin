import { useTranslation } from 'react-i18next'
import { AiCopilotPanel } from '../AiCopilotPanel'
import { TimelinePanel } from '../TimelinePanel'

/** Full-height operational event stream for companion mode. */
export function MobileEventsView() {
  const { t } = useTranslation()

  return (
    <div className="ff-mobile-events">
      <header className="ff-mobile-events__head">
        <h2>{t('mobile.eventsTitle')}</h2>
        <p>{t('mobile.eventsSubtitle')}</p>
      </header>
      <AiCopilotPanel />
      <TimelinePanel />
    </div>
  )
}
