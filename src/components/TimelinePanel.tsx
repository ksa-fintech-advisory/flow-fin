import { useTranslation } from 'react-i18next'
import { useRuntimeStore } from '../stores/useRuntimeStore'

export function TimelinePanel() {
  const { t, i18n } = useTranslation()
  const timeline = useRuntimeStore((s) => s.timeline)
  const locale = i18n.language === 'ar' ? 'ar' : 'en'

  return (
    <aside className="ff-timeline">
      <header className="ff-timeline__head">
        <div className="ff-timeline__head-row">
          <h2>{t('timeline.title')}</h2>
          {timeline.length > 0 ? (
            <span className="ff-timeline__count">{timeline.length}</span>
          ) : null}
        </div>
        <p>{t('timeline.subtitle')}</p>
      </header>
      <ol className="ff-timeline__list" aria-live="polite">
        {timeline.length === 0 ? (
          <li className="ff-timeline__empty">
            <span className="ff-timeline__empty-pulse" aria-hidden />
            <p>{t('timeline.idle')}</p>
            <span>{t('timeline.idleHint')}</span>
          </li>
        ) : null}
        {[...timeline].reverse().map((entry) => (
          <li
            key={entry.id}
            className={`ff-timeline__item ff-timeline__item--${entry.tone}`}
          >
            <div className="ff-timeline__title">{entry.title}</div>
            {entry.detail ? (
              <div className="ff-timeline__detail">{entry.detail}</div>
            ) : null}
            <time className="ff-timeline__time">
              {new Date(entry.at).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </time>
          </li>
        ))}
      </ol>
    </aside>
  )
}
