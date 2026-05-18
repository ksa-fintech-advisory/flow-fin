import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FlowFinLogo } from '../brand/FlowFinLogo'
import { TopologyBackground } from '../components/home/TopologyBackground'
import { HomeTopologyPreview } from '../components/home/HomeTopologyPreview'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { PageMeta } from '../components/PageMeta'
import { SkipLink } from '../components/SkipLink'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'
import { domainLabel } from '../i18n/helpers'
import { useScenarioDisplay } from '../hooks/useScenarioDisplay'

function countNodes(scenario: (typeof SCENARIOS)[number]): number {
  return scenario.flow.nodes.length
}

function ScenarioCard({ scenario, index }: { scenario: (typeof SCENARIOS)[number]; index: number }) {
  const { t } = useTranslation()
  const { title, subtitle } = useScenarioDisplay(scenario)

  return (
    <li key={scenario.id}>
      <Link
        to={`/playground/${scenario.id}`}
        className="ff-scenario-card ff-template-card"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="ff-template-card__preview" aria-hidden>
          <span className="ff-template-card__pulse" />
          <svg viewBox="0 0 120 48" className="ff-template-card__topology">
            <path
              d="M8 24 H40 M40 24 H72 M72 24 H104"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.45"
            />
            <circle cx="8" cy="24" r="3.5" fill="currentColor" />
            <circle cx="40" cy="24" r="3.5" fill="currentColor" opacity="0.7" />
            <circle cx="72" cy="24" r="3.5" fill="currentColor" opacity="0.7" />
            <circle cx="104" cy="24" r="3.5" fill="currentColor" />
          </svg>
        </div>
        <div className="ff-scenario-card__top">
          <span className="ff-scenario-card__index">{String(index + 1).padStart(2, '0')}</span>
          <span className="ff-scenario-card__domain">
            {domainLabel(t, scenario.flow.metadata?.domain)}
          </span>
        </div>
        <h3 className="ff-scenario-card__title">{title}</h3>
        <p className="ff-scenario-card__subtitle">{subtitle}</p>
        <div className="ff-scenario-card__meta">
          <span>{t('common.nodesCount', { count: countNodes(scenario) })}</span>
          <span>{t('common.edgesCount', { count: scenario.flow.edges.length })}</span>
          <span>{t('common.runtime')}</span>
        </div>
        <span className="ff-scenario-card__cta">
          {t('home.runSimulation')}
          <span className="ff-scenario-card__arrow" aria-hidden>
            →
          </span>
        </span>
      </Link>
    </li>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const totalNodes = SCENARIOS.reduce((n, s) => n + countNodes(s), 0)

  return (
    <div className="ff-home">
      <PageMeta
        title={t('meta.homeTitle')}
        description={t('meta.description')}
        path="/"
      />
      <SkipLink />
      <TopologyBackground />

      <header className="ff-home__nav">
        <Link to="/" className="ff-home__logo" aria-label={t('aria.home')}>
          <FlowFinLogo size={28} wordmarkClassName="ff-home__logo-text" />
        </Link>
        <nav className="ff-home__nav-links" aria-label={t('aria.primaryNav')}>
          <span className="ff-home__nav-pill">{t('home.navPill')}</span>
          <LanguageSwitcher />
          <Link to={`/playground/${DEFAULT_SCENARIO_ID}`} className="ff-btn ff-btn--primary">
            {t('home.launchPlayground')}
          </Link>
        </nav>
      </header>

      <main id="main-content" className="ff-home__main">
        <section className="ff-home__hero" aria-labelledby="home-hero-heading">
          <div className="ff-home__hero-copy">
            <p className="ff-home__eyebrow">
              <span className="ff-home__pulse" aria-hidden />
              {t('home.eyebrow')}
            </p>
            <h1 id="home-hero-heading">
              {t('home.heroTitle')}{' '}
              <span className="ff-home__gradient-text">{t('home.heroHighlight')}</span>
            </h1>
            <p className="ff-home__lead">{t('home.lead')}</p>
            <div className="ff-home__hero-actions">
              <Link
                to={`/playground/${DEFAULT_SCENARIO_ID}`}
                className="ff-btn ff-btn--primary ff-btn--lg"
              >
                {t('home.openPlayground')}
              </Link>
              <a href="#scenarios" className="ff-btn ff-btn--ghost ff-btn--lg">
                {t('home.browseTopologies')}
              </a>
            </div>
            <dl className="ff-home__stats">
              <div>
                <dt>{t('home.statsScenarios')}</dt>
                <dd>{SCENARIOS.length}</dd>
              </div>
              <div>
                <dt>{t('home.statsNodes')}</dt>
                <dd>{totalNodes}</dd>
              </div>
              <div>
                <dt>{t('home.statsSimulation')}</dt>
                <dd>{t('home.statsSimulationValue')}</dd>
              </div>
              <div>
                <dt>{t('home.statsLayout')}</dt>
                <dd>{t('home.statsLayoutValue')}</dd>
              </div>
            </dl>
          </div>
          <HomeTopologyPreview />
        </section>

        <section className="ff-home__capabilities" aria-labelledby="capabilities-heading">
          <h2 id="capabilities-heading" className="visually-hidden">
            {t('home.capabilitiesHeading')}
          </h2>
          <article className="ff-cap-card">
            <span className="ff-cap-card__icon" aria-hidden>
              ◎
            </span>
            <h3>{t('home.capTopologyTitle')}</h3>
            <p>{t('home.capTopologyBody')}</p>
          </article>
          <article className="ff-cap-card">
            <span className="ff-cap-card__icon" aria-hidden>
              ⟡
            </span>
            <h3>{t('home.capRuntimeTitle')}</h3>
            <p>{t('home.capRuntimeBody')}</p>
          </article>
          <article className="ff-cap-card">
            <span className="ff-cap-card__icon" aria-hidden>
              ⬡
            </span>
            <h3>{t('home.capInspectorTitle')}</h3>
            <p>{t('home.capInspectorBody')}</p>
          </article>
        </section>

        <section id="scenarios" className="ff-home__scenarios" aria-labelledby="scenarios-heading">
          <header className="ff-home__section-head">
            <h2 id="scenarios-heading">{t('home.scenariosTitle')}</h2>
            <p>{t('home.scenariosLead', { count: SCENARIOS.length })}</p>
          </header>

          <ul className="ff-home__grid ff-home__grid--templates">
            {SCENARIOS.map((scenario, index) => (
              <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
            ))}
          </ul>
        </section>
      </main>

      <footer className="ff-home__footer">
        <FlowFinLogo size={20} showWordmark wordmarkClassName="ff-home__footer-brand" />
        <p>{t('home.footer')}</p>
      </footer>
    </div>
  )
}
