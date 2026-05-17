import { useMemo, type CSSProperties } from 'react'
import type { FDLNode, FDLEdge } from '../fdl/types'
import {
  operationalDetailsForKind,
  roleForKind,
} from '../fdl/nodeSemantics'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'
import { NODE_VISUALS } from '../rendering/nodeVisuals'
import { NodeKindIcon } from '../rendering/nodeIcons'

function kindTitle(kind: FDLNode['kind']): string {
  if (kind === 'start') return 'Start'
  if (kind === 'end') return 'End'
  return kind.replace(/_/g, ' ')
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
      <p className="ff-detail-empty">No {direction === 'in' ? 'incoming' : 'outgoing'} edges</p>
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
            <span className="ff-detail-edge__peer">
              {peer?.label ?? peerId}
            </span>
            {e.label ? (
              <span className="ff-detail-edge__label">{e.label}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function NodeInspectorPanel() {
  const selectedId = useUiStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId)
  const flow = useGraphStore((s) => s.flow)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)
  const phase = useRuntimeStore((s) => s.phase)
  const timeline = useRuntimeStore((s) => s.timeline)

  const node = selectedId
    ? flow.nodes.find((n) => n.id === selectedId)
    : undefined

  const context = useMemo(() => {
    if (!node) return null

    const incoming = flow.edges.filter((e) => e.target === node.id)
    const outgoing = flow.edges.filter((e) => e.source === node.id)
    const seq = flow.simulation?.sequence ?? []
    const seqIndex = seq.indexOf(node.id)
    const role = roleForKind(node.kind)
    const ops = operationalDetailsForKind(node.kind, node.id)
    const runtimeState = nodeStates[node.id] ?? 'idle'

    const relatedEvents = timeline.filter((ev) => ev.nodeId === node.id)

    return {
      incoming,
      outgoing,
      seqIndex,
      seqTotal: seq.length,
      role,
      ops,
      runtimeState,
      relatedEvents: relatedEvents.slice(-4).reverse(),
    }
  }, [node, flow, nodeStates, timeline])

  if (!node || !context) {
    return (
      <aside className="ff-node-inspector ff-node-inspector--empty">
        <header className="ff-node-inspector__head">
          <h2>Node inspector</h2>
          <p>Click any node on the canvas to view topology and operational detail.</p>
        </header>
        <div className="ff-node-inspector__placeholder">
          <span className="ff-node-inspector__placeholder-icon">◎</span>
          <p>No node selected</p>
        </div>
      </aside>
    )
  }

  const visual = NODE_VISUALS[node.kind]

  return (
    <aside
      className="ff-node-inspector"
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
        <div className="ff-node-inspector__badges">
          <span className={`ff-status-pill ff-status-pill--${context.runtimeState}`}>
            {context.runtimeState}
          </span>
          <span className="ff-node-inspector__phase">Runtime · {phase}</span>
        </div>
      </header>

      <div className="ff-node-inspector__body">
        <section className="ff-detail-section">
          <h3>Role</h3>
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
            {context.seqIndex >= 0 ? (
              <div>
                <dt>Simulation step</dt>
                <dd>
                  {context.seqIndex + 1} of {context.seqTotal} (happy path)
                </dd>
              </div>
            ) : (
              <div>
                <dt>Simulation step</dt>
                <dd className="ff-detail-muted">Branch / off spine</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="ff-detail-section">
          <h3>Operational</h3>
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

        {node.metadata && Object.keys(node.metadata).length > 0 ? (
          <section className="ff-detail-section">
            <h3>FDL metadata</h3>
            <pre className="ff-detail-json">
              {JSON.stringify(node.metadata, null, 2)}
            </pre>
          </section>
        ) : null}

        <section className="ff-detail-section">
          <h3>Topology</h3>
          <p className="ff-detail-subhead">Incoming</p>
          <EdgeList
            edges={context.incoming}
            nodes={flow.nodes}
            direction="in"
          />
          <p className="ff-detail-subhead">Outgoing</p>
          <EdgeList
            edges={context.outgoing}
            nodes={flow.nodes}
            direction="out"
          />
        </section>

        {context.relatedEvents.length > 0 ? (
          <section className="ff-detail-section">
            <h3>Related events</h3>
            <ul className="ff-detail-events">
              {context.relatedEvents.map((ev) => (
                <li key={ev.id} className={`ff-detail-events__item--${ev.tone}`}>
                  <span className="ff-detail-events__title">{ev.title}</span>
                  {ev.detail ? (
                    <span className="ff-detail-events__detail">{ev.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
