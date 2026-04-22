// Helper: Claude site analysis for site recreation
// Returns shell recommendation, extracted colors, hero headline, and CTA text

export interface SiteRecreation {
  shell: string
  shellReason: string
  primaryColor: string
  accentColor: string
  heroHeadline: string
  ctaText: string
}

const SITE_ANALYSIS_PROMPT = `You are a web design analyst for a pest control SaaS platform. Analyze the provided
homepage content from a pest control company's existing website and return a JSON
object with exactly these keys:

{
  "shell": "modern-pro" | "clean-friendly" | "bold-local" | "rustic-rugged",
  "shellReason": "one sentence explaining why this shell matches their site style",
  "primaryColor": "#hexcode — the dominant brand color from their site (buttons, nav, headings)",
  "accentColor": "#hexcode — the secondary/highlight color from their site (CTAs, accents)",
  "heroHeadline": "rewritten version of their hero headline, max 8 words, punchy",
  "ctaText": "short CTA button text, max 4 words, action-oriented"
}

Shell selection rules:
- modern-pro: dark navbar, strong contrast, professional/corporate tone, navy/dark blues
- clean-friendly: light or white backgrounds, soft tones, family-safe language, approachable
- bold-local: high energy, bold saturated colors, local pride language, impact-focused
- rustic-rugged: earthy/warm tones (browns, oranges, greens), established trust language, heritage

For colors: if you cannot determine exact hex values from the content, use the most
likely color based on the brand name, tone, and any color descriptions in the markdown.
Always return valid hex codes. Default primary to #1e3a5f and accent to #f59e0b if
truly unable to determine.

Return ONLY the JSON object. No explanation, no markdown, no backticks.`

const DEFAULT: SiteRecreation = {
  shell: 'modern-pro',
  shellReason: 'Default recommendation — could not analyze site content',
  primaryColor: '#1e3a5f',
  accentColor: '#f59e0b',
  heroHeadline: 'Protecting Your Home & Family',
  ctaText: 'Get a Free Quote',
}

export async function analyzeSite(
  markdown: string,
  anthropicApiKey: string,
): Promise<SiteRecreation> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SITE_ANALYSIS_PROMPT,
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
