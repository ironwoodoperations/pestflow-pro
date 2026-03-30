export type Template = 'bold' | 'clean' | 'modern'

export interface TemplateTokens {
  heroFont: string
  bodyFont: string
  heroBg: string
  heroText: string
  ctaBg: string
  ctaText: string
  ctaHover: string
  navBg: string
  navText: string
  footerBg: string
  footerText: string
  cardBg: string
  accentColor: string
  buttonClass: string
  headingClass: string
}

export const TEMPLATES: Record<Template, TemplateTokens> = {
  bold: {
    heroFont: 'font-bangers tracking-wide',
    bodyFont: 'font-sans',
    heroBg: 'bg-[#0a0f1e]',
    heroText: 'text-white',
    ctaBg: 'bg-emerald-500',
    ctaText: 'text-white',
    ctaHover: 'hover:bg-emerald-600',
    navBg: 'bg-white',
    navText: 'text-gray-700',
    footerBg: 'bg-[#0a0f1e]',
    footerText: 'text-gray-300',
    cardBg: 'bg-gray-100',
    accentColor: '#10b981',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-6 py-3 transition',
    headingClass: 'font-bangers tracking-wide',
  },
  clean: {
    heroFont: 'font-serif tracking-tight',
    bodyFont: 'font-sans',
    heroBg: 'bg-blue-900',
    heroText: 'text-white',
    ctaBg: 'bg-blue-700',
    ctaText: 'text-white',
    ctaHover: 'hover:bg-blue-800',
    navBg: 'bg-white',
    navText: 'text-gray-900',
    footerBg: 'bg-gray-900',
    footerText: 'text-gray-400',
    cardBg: 'bg-white',
    accentColor: '#1d4ed8',
    buttonClass: 'bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md px-6 py-3 transition',
    headingClass: 'font-serif tracking-tight',
  },
  modern: {
    heroFont: 'font-mono tracking-tight',
    bodyFont: 'font-sans',
    heroBg: 'bg-gray-950',
    heroText: 'text-white',
    ctaBg: 'bg-teal-500',
    ctaText: 'text-white',
    ctaHover: 'hover:bg-teal-400',
    navBg: 'bg-gray-950',
    navText: 'text-gray-100',
    footerBg: 'bg-black',
    footerText: 'text-gray-500',
    cardBg: 'bg-gray-900',
    accentColor: '#14b8a6',
    buttonClass: 'bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-sm px-6 py-3 transition',
    headingClass: 'font-mono tracking-tight',
  },
}
