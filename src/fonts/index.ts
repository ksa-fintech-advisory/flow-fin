/**
 * Font setup — same families as next/font/google:
 *   Amiri_Quran, IBM_Plex_Sans_Arabic, Inter
 *
 * Loaded via @fontsource (self-hosted). Locale stacks are applied in index.css
 * using `html[lang]` (see syncDocumentLanguage).
 */

import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'

import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css'

import '@fontsource/amiri-quran/arabic-400.css'

/** Latin UI — `Inter` */
export const inter = {
  variable: '--font-inter',
  family: "'Inter', system-ui, sans-serif",
} as const

/** Arabic UI — `IBM_Plex_Sans_Arabic` */
export const ibmPlexSansArabic = {
  variable: '--font-ibm-plex-arabic',
  family: "'IBM Plex Sans Arabic', 'Inter', system-ui, sans-serif",
} as const

/** Arabic display — `Amiri_Quran` */
export const amiriQuran = {
  variable: '--font-amiri-quran',
  family: "'Amiri Quran', 'IBM Plex Sans Arabic', Georgia, serif",
} as const
