/** Product identity, SEO defaults, and social preview configuration. */

export const SITE_NAME = 'FlowFin'

export const SITE_TAGLINE = 'Fintech orchestration & financial runtime visualization'

export const SITE_DESCRIPTION =
  'FlowFin is a fintech orchestration platform and financial systems IDE — model payment topologies, simulate runtime propagation, and observe transaction flows with infrastructure-grade visibility.'

export const SITE_KEYWORDS = [
  'financial flow visualization',
  'fintech orchestration',
  'payment topology simulation',
  'runtime visualization',
  'financial systems observability',
  'payment flow simulator',
  'transaction runtime monitoring',
  'financial infrastructure tooling',
  'topology simulation platform',
  'financial runtime',
].join(', ')

export const SITE_ORIGIN =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ??
  (typeof window !== 'undefined' ? window.location.origin : '')

export const DEFAULT_OG_IMAGE = '/og-image.svg'

export type PageMetaInput = {
  title: string
  description?: string
  path?: string
  ogType?: 'website' | 'article'
  noIndex?: boolean
}

export function resolvePageUrl(path = '/'): string {
  const origin = SITE_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return origin ? `${origin}${normalized}` : normalized
}

export function formatDocumentTitle(title: string): string {
  if (title === SITE_NAME || title.startsWith(`${SITE_NAME} ·`)) return title
  return `${title} · ${SITE_NAME}`
}

export const HOME_META: PageMetaInput = {
  title: `${SITE_NAME} · ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  path: '/',
}

export function playgroundMeta(
  scenarioId: string,
  scenarioTitle: string,
  scenarioSubtitle: string,
): PageMetaInput {
  return {
    title: `${scenarioTitle} · Runtime playground`,
    description: `${scenarioSubtitle} — simulate payment propagation, inspect nodes, and trace financial runtime behavior in FlowFin.`,
    path: `/playground/${scenarioId}`,
  }
}
