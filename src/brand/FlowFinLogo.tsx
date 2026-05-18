import { useId } from 'react'

type FlowFinLogoProps = {
  /** Mark size in pixels */
  size?: number
  showWordmark?: boolean
  wordmarkClassName?: string
  className?: string
  /** Accessible label; omit when decorative (parent provides name) */
  title?: string
}

/** Topology-inspired mark: hub node with propagation rails. */
export function FlowFinLogoMark({
  size = 24,
  className,
  title,
}: Pick<FlowFinLogoProps, 'size' | 'className' | 'title'>) {
  const uid = useId().replace(/:/g, '')
  const bgId = `ff-logo-bg-${uid}`
  const railId = `ff-logo-rail-${uid}`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="32" height="32" rx="8" fill={`url(#${bgId})`} />
      <path
        d="M8 22.5h16"
        stroke={`url(#${railId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M11 19.5 16 11l5 8.5"
        stroke={`url(#${railId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx="8" cy="22.5" r="2.25" fill="#34d399" />
      <circle cx="24" cy="22.5" r="2.25" fill="#38bdf8" />
      <circle cx="16" cy="11" r="3" fill="#f8fafc" />
      <circle cx="16" cy="11" r="5.5" stroke="#38bdf8" strokeWidth="1" opacity="0.35" />
      <path
        d="M18.2 13.2 21.5 16.5"
        stroke="#34d399"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.9"
      />
      <defs>
        <linearGradient id={bgId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#172554" />
        </linearGradient>
        <linearGradient id={railId} x1="8" y1="22" x2="24" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function FlowFinLogo({
  size = 24,
  showWordmark = true,
  wordmarkClassName = '',
  className = '',
  title,
}: FlowFinLogoProps) {
  return (
    <span className={`ff-brand ${className}`.trim()}>
      <FlowFinLogoMark size={size} title={title} className="ff-brand__mark" />
      {showWordmark ? (
        <span className={`ff-brand__wordmark ${wordmarkClassName}`.trim()}>FlowFin</span>
      ) : null}
    </span>
  )
}
