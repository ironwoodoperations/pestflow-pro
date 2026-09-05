// Helper: Claude site analysis for site recreation
// Returns shell recommendation, extracted colors, hero headline, and CTA text
//
// S346 — the prompt moved to ./prompts.ts and is built per vertical. It lives
// there rather than here so vitest can assert on it without loading this file's
// fetch path, and so both scrape prompts are edited in one place.

import { siteAnalysisPromptFor } from './prompts.ts'

export interface SiteRecreation {
  shell: string
  shellReason: string
  primaryColor: string
  accentColor: string
  heroHeadline: string
  ctaText: string
}

const DEFAULT: SiteRecreation = {
  shell: 'modern-pro',
  shellReason: 'Default recommendation — could not analyze site content',
  primaryColor: '#1e3a5f',
  accentColor: '#f59e0b',
  heroHeadline: 'Protecting Your Home & Family',
  ctaText: 'Get a Free Quote',
}

// Routes through ai-proxy's public operator lane (feature
// 'scrape_prospect_analyze'), forwarding the operator's Bearer JWT. ai-proxy
// pins the model + adds anthropic-version; never calls api.anthropic.com here.
export async function analyzeSite(
  markdown: string,
  aiProxyUrl: string,
  authHeader: string,
  vertical?: string | null,
): Promise<SiteRecreation> {
  try {
    const res = await fetch(aiProxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feature: 'scrape_prospect_analyze',
        tenant_id: null,
        max_tokens: 500,
        system: siteAnalysisPromptFor(vertical),
        messages: [{ role: 'user', content: markdown.slice(0, 15000) }],
      }),
    })
    if (!res.ok) return DEFAULT
    const data = await res.json()
    const rawText = data?.content?.[0]?.text || ''
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      shell: parsed.shell || DEFAULT.shell,
      shellReason: parsed.shellReason || DEFAULT.shellReason,
      primaryColor: parsed.primaryColor || DEFAULT.primaryColor,
      accentColor: parsed.accentColor || DEFAULT.accentColor,
      heroHeadline: parsed.heroHeadline || DEFAULT.heroHeadline,
      ctaText: parsed.ctaText || DEFAULT.ctaText,
    }
  } catch {
    return DEFAULT
  }
}
