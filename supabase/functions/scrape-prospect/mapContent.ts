// Helper: map URL paths to page slugs and extract structured content from markdown

export function pathToSlug(urlPath: string): string | null {
  const p = urlPath.toLowerCase()
  if (p === '/' || p === '' || p === '/home') return 'home'
  if (p.includes('termite-inspect')) return 'termite-inspections'
  if (p.includes('termite')) return 'termite-control'
  if (p.includes('roach')) return 'roach-control'
  if (p.includes('ant-control') || p === '/ant') return 'ant-control'
  if (p.includes('mosquito')) return 'mosquito-control'
  if (p.includes('bed-bug')) return 'bed-bug-control'
  if (p.includes('flea')) return 'flea-tick-control'
  if (p.includes('rodent')) return 'rodent-control'
  if (p.includes('scorpion')) return 'scorpion-control'
  if (p.includes('spider')) return 'spider-control'
  if (p.includes('wasp')) return 'wasp-hornet-control'
  if (p.includes('service') || p.includes('pest-control')) return 'pest-control'
  if (p.includes('about')) return 'about'
  if (p.includes('contact')) return 'contact'
  if (p.includes('faq')) return 'faq'
  return null
}

export interface PageContent {
  title: string | null
  intro: string | null
  subtitle: string | null
}

export function extractPageContent(
  markdown: string,
  metadata: Record<string, any>,
): PageContent {
  const title = (metadata?.title as string | undefined) || extractH1(markdown) || null
  const subtitle = (metadata?.description as string | undefined) || null
  const intro = extractIntro(markdown) || null
  return { title, intro, subtitle }
}

function extractH1(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function extractIntro(md: string): string | null {
  for (const line of md.split('\n')) {
    const t = line.trim()
    if (
      t.length >= 50 &&
      !t.startsWith('#') &&
      !t.startsWith('!') &&
      !t.startsWith('|') &&
      !t.startsWith('>')
    ) {
      return t.slice(0, 400)
    }
  }
  return null
}
