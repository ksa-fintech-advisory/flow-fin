import { useMemo, type CSSProperties } from 'react'
import type { FDLNode, FDLEdge } from '../fdl/types'
import {
  inspectorConfigForKind,
  operationalDetailsForKind,
  roleForKind,
  samplePayloadForKind,
} from '../fdl/nodeSemantics'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore, type InspectorTab } from '../stores/useUiStore'
import { FlowFinLogoMark } from '../brand/FlowFinLogo'
import { NODE_VISUALS } from '../rendering/nodeVisuals'
import { NodeKindIcon } from '../rendering/nodeIcons'

const TABS: { id: InspectorTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'config', label: 'Config' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'logs', label: 'Logs' },
]

function kindTitle(kind: FDLNode['kind']): string {
  if (kind === 'start') return 'Start'
  if (kind === 'end') return 'End'
  return kind.replace(/_/g, ' ')
}

function healthLabel(state: string): { label: string; tone: string } {
  switch (state) {
    case 'running':
      return { label: 'Propagating', tone: 'active' }
    case 'success':
      return { label: 'Healthy', tone: 'ok' }
    case 'failed':
      return { label: 'Degraded', tone: 'error' }
    case 'retrying':
      return { label: 'Retrying', tone: 'warn' }
    default:
      return { label: 'Standby', tone: 'idle' }
  }
}

function EdgeList({
  edges,
  nodes,
  direction,
}: {
  edges: FDLEdge[]
  nodes: FDLNode[]
  direction: 'in' | 'out'
}) {
  if (edges.length === 0) {
    return (
      <p className="ff-detail-empty">
        No {direction === 'in' ? 'incoming' : 'outgoing'} edges
      </p>
    )
  }

  return (
    <ul className="ff-detail-edges">
      {edges.map((e) => {
        const peerId = direction === 'in' ? e.source : e.target
        const peer = nodes.find((n) => n.id === peerId)
        return (
          <li key={e.id} className="ff-detail-edge">
            <span className="ff-detail-edge__arrow">
              {direction === 'in' ? '←' : '→'}
            </span>
            <span className="ff-detail-edge__peer">{peer?.label ?? peerId}</span>
            {e.label ? (
              <span className="ff-detail-edge__label">{e.label}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function ConfigField({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="ff-inspector-field">
      <label className="ff-inspector-field__label">{label}</label>
      <div className={`ff-inspector-field__value ${mono ? 'ff-inspector-field__value--mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}

export function NodeInspectorPanel() {
  const selectedId = useUiStore((s) => s.selectedNodeId)
  const tab = useUiStore((s) => s.inspectorTab)
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId)
  const setInspectorTab = useUiStore((s) => s.setInspectorTab)
  const flow = useGraphStore((s) => s.flow)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)
  const phase = useRuntimeStore((s) => s.phase)
  const timeline = useRuntimeStore((s) => s.timeline)
  const activeEdgePayloads = useRuntimeStore((s) => s.activeEdgePayloads)
  const cursor = useRuntimeStore((s) => s.cursor)

  const node = selectedId ? flow.nodes.find((n) => n.id === selectedId) : undefined

  const context = useMemo(() => {
    if (!node) return null

    const incoming = flow.edges.filter((e) => e.target === node.id)
    const outgoing = flow.edges.filter((e) => e.source === node.id)
    const seq = flow.simulation?.sequence ?? []
    const seqIndex = seq.indexOf(node.id)
    const role = roleForKind(node.kind)
    const ops = operationalDetailsForKind(node.kind, node.id)
    const configGroups = inspectorConfigForKind(node.kind, node.id)
    const payload = samplePayloadForKind(node.kind, node.id)
    const runtimeState = nodeStates[node.id] ?? 'idle'
    const health = healthLabel(runtimeState)

    const relatedEvents = timeline.filter((ev) => ev.nodeId === node.id)
    const activePayload = Object.values(activeEdgePayloads).find(Boolean)

    const runtimeLogs = relatedEvents.map((ev) => ({
      at: ev.at,
      level: ev.tone === 'error' ? 'error' : ev.tone === 'warn' ? 'warn' : 'info',
      message: ev.title,
      detail: ev.detail,
    }))

    if (runtimeState === 'running' && runtimeLogs.length === 0) {
      runtimeLogs.push({
        at: Date.now(),
        level: 'info',
        message: 'Node armed',
        detail: 'Awaiting propagation tick',
      })
    }

    return {
      incoming,
      outgoing,
      seqIndex,
      seqTotal: seq.length,
      role,
      ops,
      configGroups,
      payload,
      runtimeState,
      health,
      relatedEvents: relatedEvents.slice(-6).reverse(),
      runtimeLogs,
      activePayload,
      stepLabel: cursor < 0 ? '—' : String(cursor + 1),
    }
  }, [node, flow, nodeStates, timeline, activeEdgePayloads, cursor])

  if (!node || !context) {
    return (
      <aside className="ff-node-inspector ff-node-inspector--empty">
        <header className="ff-node-inspector__head">
          <div className="ff-node-inspector__empty-brand">
            <FlowFinLogoMark size={28} className="ff-node-inspector__empty-icon" />
            <div>
              <h2>Node inspector</h2>
              <p>Select a node to configure integrations, inspect runtime state, and trace execution.</p>
            </div>
          </div>
        </header>
        <div className="ff-node-inspector__placeholder">
          <div className="ff-node-inspector__placeholder-rings" aria-hidden />
          <p>No node selected</p>
          <span>Click any node on the topology canvas</span>
        </div>
      </aside>
    )
  }

  const visual = NODE_VISUALS[node.kind]

  return (
    <aside
      className="ff-node-inspector ff-node-inspector--active"
      style={
        {
          '--accent': visual.accent,
          '--accent-muted': visual.muted,
        } as CSSProperties
      }
    >
      <header className="ff-node-inspector__head">
        <div className="ff-node-inspector__head-row">
          <span
            className="ff-node-inspector__icon"
            style={{ background: visual.muted, color: visual.accent }}
          >
            <NodeKindIcon kind={node.kind} />
          </span>
          <div className="ff-node-inspector__titles">
            <h2>{node.label ?? node.id}</h2>
            <span className="ff-node-inspector__kind">{kindTitle(node.kind)}</span>
          </div>
          <button
            type="button"
            className="ff-node-inspector__close"
            onClick={() => setSelectedNodeId(null)}
            aria-label="Close inspector"
          >
            ×
          </button>
        </div>

        <div className="ff-node-inspector__health">
          <span className={`ff-health-dot ff-health-dot--${context.health.tone}`} />
          <span className="ff-node-inspector__health-label">{context.health.label}</span>
          <span className={`ff-status-pill ff-status-pill--${context.runtimeState}`}>
            {context.runtimeState}
          </span>
          <span className="ff-node-inspector__phase">Phase · {phase}</span>
        </div>

        <nav className="ff-inspector-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`ff-inspector-tabs__btn ${tab === t.id ? 'ff-inspector-tabs__btn--active' : ''}`}
              onClick={() => setInspectorTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="ff-node-inspector__body" key={tab}>
        {tab === 'overview' && (
          <>
            <section className="ff-detail-section">
              <h3>Operational role</h3>
              <p className="ff-detail-prose">
                <strong>{context.role.title}</strong> — {context.role.description}
              </p>
            </section>

            <section className="ff-detail-section">
              <h3>Identity</h3>
              <dl className="ff-detail-dl">
                <div>
                  <dt>Node ID</dt>
                  <dd className="ff-detail-dl__mono">{node.id}</dd>
                </div>
                <div>
                  <dt>FDL kind</dt>
                  <dd>{node.kind}</dd>
                </div>
                <div>
                  <dt>Simulation step</dt>
                  <dd>
                    {context.seqIndex >= 0
                      ? `${context.seqIndex + 1} of ${context.seqTotal}`
                      : 'Branch / off spine'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="ff-detail-section">
              <h3>Operational detail</h3>
              <dl className="ff-detail-dl">
                {context.ops.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd className={row.mono ? 'ff-detail-dl__mono' : undefined}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="ff-detail-section">
              <h3>Topology</h3>
              <p className="ff-detail-subhead">Incoming</p>
              <EdgeList edges={context.incoming} nodes={flow.nodes} direction="in" />
              <p className="ff-detail-subhead">Outgoing</p>
              <EdgeList edges={context.outgoing} nodes={flow.nodes} direction="out" />
            </section>
          </>
        )}

        {tab === 'config' && (
          <>
            {context.configGroups.map((group) => (
              <section key={group.id} className="ff-detail-section">
                <h3>{group.title}</h3>
                <div className="ff-inspector-fields">
                  {group.fields.map((f) => (
                    <ConfigField
                      key={f.label}
                      label={f.label}
                      value={f.value}
                      mono={f.mono}
                    />
                  ))}
                </div>
              </section>
            ))}
            <section className="ff-detail-section">
              <h3>Endpoint</h3>
              <div className="ff-inspector-code-block">
                <code>POST /v1/nodes/{node.id}/execute</code>
              </div>
              <p className="ff-detail-hint">
                Placeholder API surface · wire to your orchestration backend in production.
              </p>
            </section>
          </>
        )}

        {tab === 'runtime' && (
          <>
            <section className="ff-detail-section">
              <h3>Runtime state</h3>
              <div className="ff-runtime-metrics">
                <div className="ff-runtime-metric">
                  <span className="ff-runtime-metric__label">State</span>
                  <span className={`ff-status-pill ff-status-pill--${context.runtimeState}`}>
                    {context.runtimeState}
                  </span>
                </div>
                <div className="ff-runtime-metric">
                  <span className="ff-runtime-metric__label">Global step</span>
                  <span className="ff-runtime-metric__value">{context.stepLabel}</span>
                </div>
                <div className="ff-runtime-metric">
                  <span className="ff-runtime-metric__label">Phase</span>
                  <span className="ff-runtime-metric__value">{phase}</span>
                </div>
              </div>
            </section>

            {context.activePayload ? (
              <section className="ff-detail-section">
                <h3>Active propagation</h3>
                <p className="ff-detail-prose ff-detail-prose--packet">
                  {context.activePayload}
                </p>
              </section>
            ) : null}

            <section className="ff-detail-section">
              <h3>Transaction payload</h3>
              <pre className="ff-detail-json">
                {JSON.stringify(context.payload, null, 2)}
              </pre>
            </section>

            <section className="ff-detail-section">
              <h3>Simulation behavior</h3>
              <dl className="ff-detail-dl">
                <div>
                  <dt>Mode</dt>
                  <dd>Deterministic spine</dd>
                </div>
                <div>
                  <dt>Delay</dt>
                  <dd>{flow.simulation?.stepDelayMs ?? 1000}ms / step</dd>
                </div>
              </dl>
            </section>
          </>
        )}

        {tab === 'logs' && (
          <>
            <section className="ff-detail-section">
              <h3>Execution history</h3>
              {context.relatedEvents.length === 0 ? (
                <p className="ff-detail-empty">No events yet — run simulation to populate</p>
              ) : (
                <ul className="ff-detail-events">
                  {context.relatedEvents.map((ev) => (
                    <li key={ev.id} className={`ff-detail-events__item--${ev.tone}`}>
                      <span className="ff-detail-events__title">{ev.title}</span>
                      {ev.detail ? (
                        <span className="ff-detail-events__detail">{ev.detail}</span>
                      ) : null}
                      <time className="ff-detail-events__time">
                        {new Date(ev.at).toLocaleTimeString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="ff-detail-section">
              <h3>Runtime logs</h3>
              <ul className="ff-runtime-logs">
                {context.runtimeLogs.length === 0 ? (
                  <li className="ff-runtime-logs__empty">Waiting for runtime activity…</li>
                ) : (
                  context.runtimeLogs.map((log, i) => (
                    <li key={`${log.at}-${i}`} className={`ff-runtime-logs__line ff-runtime-logs__line--${log.level}`}>
                      <span className="ff-runtime-logs__time">
                        {new Date(log.at).toLocaleTimeString()}
                      </span>
                      <span className="ff-runtime-logs__msg">{log.message}</span>
                      {log.detail ? (
                        <span className="ff-runtime-logs__detail">{log.detail}</span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        )}
      </div>
    </aside>
  )
}
