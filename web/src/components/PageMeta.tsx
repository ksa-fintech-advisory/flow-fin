import { useEffect } from 'react'
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
  formatDocumentTitle,
  resolvePageUrl,
  type PageMetaInput,
} from '../brand/site'

function upsertMeta(
  selector: string,
  create: () => HTMLMetaElement,
  content: string,
) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function PageMeta({
  title,
  description = SITE_DESCRIPTION,
  path,
  ogType = 'website',
  noIndex = false,
}: PageMetaInput) {
  useEffect(() => {
    const documentTitle = formatDocumentTitle(title)
    const url = resolvePageUrl(path ?? window.location.pathname)
    const origin = SITE_ORIGIN || window.location.origin
    const image = origin
      ? `${origin}${DEFAULT_OG_IMAGE.startsWith('/') ? DEFAULT_OG_IMAGE : `/${DEFAULT_OG_IMAGE}`}`
      : DEFAULT_OG_IMAGE

    document.title = documentTitle

    upsertMeta('meta[name="description"]', () => {
      const m = document.createElement('meta')
      m.name = 'description'
      return m
    }, description)

    upsertMeta('meta[name="keywords"]', () => {
      const m = document.createElement('meta')
      m.name = 'keywords'
      return m
    }, SITE_KEYWORDS)

    upsertMeta('meta[name="robots"]', () => {
      const m = document.createElement('meta')
      m.name = 'robots'
      return m
    }, noIndex ? 'noindex, nofollow' : 'index, follow')

    upsertMeta('meta[property="og:title"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:title')
      return m
    }, documentTitle)

    upsertMeta('meta[property="og:description"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:description')
      return m
    }, description)

    upsertMeta('meta[property="og:type"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:type')
      return m
    }, ogType)

    upsertMeta('meta[property="og:site_name"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:site_name')
      return m
    }, SITE_NAME)

    upsertMeta('meta[property="og:url"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:url')
      return m
    }, url)

    upsertMeta('meta[property="og:image"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:image')
      return m
    }, image)

    upsertMeta('meta[property="og:image:alt"]', () => {
      const m = document.createElement('meta')
      m.setAttribute('property', 'og:image:alt')
      return m
    }, `${SITE_NAME} — fintech orchestration and financial runtime topology visualization`)

    upsertMeta('meta[name="twitter:card"]', () => {
      const m = document.createElement('meta')
      m.name = 'twitter:card'
      return m
    }, 'summary_large_image')

    upsertMeta('meta[name="twitter:title"]', () => {
      const m = document.createElement('meta')
      m.name = 'twitter:title'
      return m
    }, documentTitle)

    upsertMeta('meta[name="twitter:description"]', () => {
      const m = document.createElement('meta')
      m.name = 'twitter:description'
      return m
    }, description)

    upsertMeta('meta[name="twitter:image"]', () => {
      const m = document.createElement('meta')
      m.name = 'twitter:image'
      return m
    }, image)

    upsertMeta('meta[name="twitter:image:alt"]', () => {
      const m = document.createElement('meta')
      m.name = 'twitter:image:alt'
      return m
    }, `${SITE_NAME} — financial runtime visualization platform`)

    upsertLink('canonical', url)

    const orgJson = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Financial flow visualization',
        'Payment topology simulation',
        'Runtime propagation tracing',
        'Fintech orchestration',
      ],
    }

    upsertJsonLd('ff-jsonld-app', orgJson)
  }, [title, description, path, ogType, noIndex])

  return null
}
