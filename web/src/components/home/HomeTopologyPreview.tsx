import { Link } from 'react-router-dom'
import { DEFAULT_SCENARIO_ID } from '../../fdl/scenarios'

/** Mini interactive-style topology demo for the home hero. */
export function HomeTopologyPreview() {
  return (
    <div className="ff-home-preview">
      <div className="ff-home-preview__chrome">
        <div className="ff-home-preview__bar">
          <span className="ff-home-preview__dot ff-home-preview__dot--live" />
          <span className="ff-home-preview__label">Runtime · propagation</span>
          <span className="ff-home-preview__badge">LIVE</span>
        </div>
        <svg
          className="ff-home-preview__graph"
          viewBox="0 0 520 200"
          role="img"
          aria-label="Animated financial topology preview"
        >
          <defs>
            <linearGradient id="ff-preview-edge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.2)" />
              <stop offset="50%" stopColor="rgba(56, 189, 248, 0.9)" />
              <stop offset="100%" stopColor="rgba(52, 211, 153, 0.7)" />
            </linearGradient>
          </defs>
          <path
            className="ff-home-preview__wire"
            d="M 40 100 H 140 L 180 60 H 280 L 320 140 H 420 L 460 100 H 480"
            fill="none"
            stroke="url(#ff-preview-edge)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            className="ff-home-preview__packet"
            d="M 40 100 H 140 L 180 60 H 280 L 320 140 H 420 L 460 100 H 480"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="12 200"
          />
          {[
            { x: 40, y: 100, label: 'Start' },
            { x: 140, y: 100, label: 'Gateway' },
            { x: 180, y: 60, label: 'Risk' },
            { x: 280, y: 60, label: 'Issuer' },
            { x: 320, y: 140, label: 'Settle' },
            { x: 480, y: 100, label: 'End' },
          ].map((n) => (
            <g key={n.label} transform={`translate(${n.x}, ${n.y})`}>
              <rect
                x="-36"
                y="-22"
                width="72"
                height="44"
                rx="10"
                className="ff-home-preview__node"
              />
              <text y="5" textAnchor="middle" className="ff-home-preview__node-label">
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="ff-home-preview__footer">
          <span>Card payment · approved path</span>
          <Link to={`/playground/${DEFAULT_SCENARIO_ID}`} className="ff-home-preview__link">
            Open playground →
          </Link>
        </div>
      </div>
    </div>
  )
}
