/** Animated mesh + propagation lines for the home hero. */
export function TopologyBackground() {
  return (
    <div className="ff-topology-bg" aria-hidden>
      <svg
        className="ff-topology-bg__mesh"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="ff-mesh-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.14)" />
            <stop offset="55%" stopColor="rgba(56, 189, 248, 0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="ff-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
            <stop offset="45%" stopColor="rgba(56, 189, 248, 0.55)" />
            <stop offset="100%" stopColor="rgba(52, 211, 153, 0.35)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#ff-mesh-glow)" />
        <g className="ff-topology-bg__grid" opacity="0.35">
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 90 + 30}
              y1={0}
              x2={i * 90 + 30}
              y2={800}
              stroke="rgba(51, 65, 85, 0.45)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 80 + 20}
              x2={1200}
              y2={i * 80 + 20}
              stroke="rgba(51, 65, 85, 0.35)"
              strokeWidth="1"
            />
          ))}
        </g>
        <g className="ff-topology-bg__paths">
          <path
            className="ff-topology-bg__path ff-topology-bg__path--1"
            d="M 80 420 C 220 380, 340 460, 480 400 S 720 320, 920 380 S 1080 440, 1140 360"
            fill="none"
            stroke="url(#ff-line-grad)"
            strokeWidth="1.5"
            strokeDasharray="8 12"
          />
          <path
            className="ff-topology-bg__path ff-topology-bg__path--2"
            d="M 120 520 C 280 480, 400 560, 560 500 S 800 420, 1000 480"
            fill="none"
            stroke="rgba(52, 211, 153, 0.35)"
            strokeWidth="1.2"
            strokeDasharray="6 14"
          />
          <path
            className="ff-topology-bg__path ff-topology-bg__path--3"
            d="M 200 280 C 360 240, 500 300, 640 260 S 880 200, 1060 240"
            fill="none"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1"
            strokeDasharray="4 16"
          />
        </g>
        <g className="ff-topology-bg__nodes">
          {[
            [80, 420],
            [480, 400],
            [720, 320],
            [920, 380],
            [1140, 360],
            [560, 500],
            [1000, 480],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx}, ${cy})`}>
              <circle r="28" className="ff-topology-bg__node-ring" />
              <circle r="6" className="ff-topology-bg__node-core" />
            </g>
          ))}
        </g>
      </svg>
      <div className="ff-topology-bg__scan" />
    </div>
  )
}
