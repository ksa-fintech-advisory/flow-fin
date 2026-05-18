import { Link } from 'react-router-dom'
import { FlowFinLogo } from '../brand/FlowFinLogo'
import { HOME_META } from '../brand/site'
import { TopologyBackground } from '../components/home/TopologyBackground'
import { HomeTopologyPreview } from '../components/home/HomeTopologyPreview'
import { PageMeta } from '../components/PageMeta'
import { SkipLink } from '../components/SkipLink'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'

function domainLabel(domain: unknown): string {
  if (typeof domain === 'string' && domain.length) return domain
  return 'general'
}

function countNodes(scenario: (typeof SCENARIOS)[number]): number {
  return scenario.flow.nodes.length
}

export function HomePage() {
  const totalNodes = SCENARIOS.reduce((n, s) => n + countNodes(s), 0)

  return (
    <div className="ff-home">
      <PageMeta {...HOME_META} />
      <SkipLink />
      <TopologyBackground />

      <header className="ff-home__nav">
        <Link to="/" className="ff-home__logo" aria-label="FlowFin home">
          <FlowFinLogo size={28} wordmarkClassName="ff-home__logo-text" />
        </Link>
        <nav className="ff-home__nav-links" aria-label="Primary">
          <span className="ff-home__nav-pill">Runtime orchestration</span>
          <Link to={`/playground/${DEFAULT_SCENARIO_ID}`} className="ff-btn ff-btn--primary">
            Launch playground
          </Link>
        </nav>
      </header>

      <main id="main-content" className="ff-home__main">
        <section className="ff-home__hero" aria-labelledby="home-hero-heading">
          <div className="ff-home__hero-copy">
            <p className="ff-home__eyebrow">
              <span className="ff-home__pulse" aria-hidden />
              Financial runtime control plane
            </p>
            <h1 id="home-hero-heading">
              Orchestrate money flows across{' '}
              <span className="ff-home__gradient-text">live topology</span>
            </h1>
            <p className="ff-home__lead">
              FlowFin is a fintech orchestration platform and financial systems IDE for
              modeling, simulating, and inspecting financial propagation — with operational
              visibility into every node, edge, and runtime handoff.
            </p>
            <div className="ff-home__hero-actions">
              <Link
                to={`/playground/${DEFAULT_SCENARIO_ID}`}
                className="ff-btn ff-btn--primary ff-btn--lg"
              >
                Open runtime playground
              </Link>
              <a href="#scenarios" className="ff-btn ff-btn--ghost ff-btn--lg">
                Browse topologies
              </a>
            </div>
            <dl className="ff-home__stats">
              <div>
                <dt>Scenarios</dt>
                <dd>{SCENARIOS.length}</dd>
              </div>
              <div>
                <dt>Topology nodes</dt>
                <dd>{totalNodes}</dd>
              </div>
              <div>
                <dt>Simulation</dt>
                <dd>Live propagation</dd>
              </div>
              <div>
                <dt>Layout</dt>
                <dd>ELK · layered</dd>
              </div>
            </dl>
          </div>
          <HomeTopologyPreview />
        </section>

        <section className="ff-home__capabilities" aria-labelledby="capabilities-heading">
          <h2 id="capabilities-heading" className="visually-hidden">
            Platform capabilities
          </h2>
          <article className="ff-cap-card">
            <span className="ff-cap-card__icon" aria-hidden>
              ◎
            </span>
            <h3>Topology intelligence</h3>
            <p>
              Layered graph layouts with bidirectional rails — request paths and response
              corridors rendered as first-class operational topology.
            </p>
          </article>
          <article className="ff-cap-card">
            <span className="ff-cap-card__icon" aria-hidden>
              ⟡
            </span>
            <h3>Runtime propagation</h3>
            <p>
              Step through simulations with packet-style edge payloads, decline paths, and
              per-node state — like tracing packets through infrastructure.
            </p>
          </article>
          <article className="ff-cap-card">
            <span className="ff-cap-card__icon" aria-hidden>
              ⬡
            </span>
            <h3>Node inspection</h3>
            <p>
              Enterprise-grade inspectors for integration settings, retries, fees, routing,
              webhooks, and execution history on every financial node.
            </p>
          </article>
        </section>

        <section id="scenarios" className="ff-home__scenarios" aria-labelledby="scenarios-heading">
          <header className="ff-home__section-head">
            <h2 id="scenarios-heading">Financial topologies</h2>
            <p>
              {SCENARIOS.length} operational scenarios · select a flow to simulate propagation
              and inspect runtime behavior
            </p>
          </header>

          <ul className="ff-home__grid">
            {SCENARIOS.map((scenario, index) => (
              <li key={scenario.id}>
                <Link
                  to={`/playground/${scenario.id}`}
                  className="ff-scenario-card"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="ff-scenario-card__top">
                    <span className="ff-scenario-card__index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="ff-scenario-card__domain">
                      {domainLabel(scenario.flow.metadata?.domain)}
                    </span>
                  </div>
                  <h3 className="ff-scenario-card__title">{scenario.title}</h3>
                  <p className="ff-scenario-card__subtitle">{scenario.subtitle}</p>
                  <div className="ff-scenario-card__meta">
                    <span>{countNodes(scenario)} nodes</span>
                    <span>{scenario.flow.edges.length} edges</span>
                  </div>
                  <span className="ff-scenario-card__cta">
                    Inspect topology
                    <span className="ff-scenario-card__arrow" aria-hidden>
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="ff-home__footer">
        <FlowFinLogo size={20} showWordmark wordmarkClassName="ff-home__footer-brand" />
        <p>
          Fintech orchestration · payment topology simulation · financial runtime observability
        </p>
      </footer>
    </div>
  )
}
