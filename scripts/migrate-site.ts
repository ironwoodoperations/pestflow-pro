/**
 * PestFlow Pro — Firecrawl Migration Tool
 *
 * Usage: doppler run --config prd -- npx ts-node scripts/migrate-site.ts <url> <slug>
 * Example: doppler run --config prd -- npx ts-node scripts/migrate-site.ts https://example-pest.com acmepest
 *
 * Output: scripts/output/<slug>-content.md
 */

import * as fs from 'fs'
import * as path from 'path'

const [,, siteUrl, slug] = process.argv

if (!siteUrl || !slug) {
  console.error('Usage: npx ts-node scripts/migrate-site.ts <url> <slug>')
  process.exit(1)
}

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
if (!FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY not found. Run with: doppler run --config prd --')
  process.exit(1)
}

// ── Firecrawl crawl types ──────────────────────────────────────────────────
interface FirecrawlPage {
  url: string
  markdown?: string
  metadata?: { title?: string; description?: string }
}

interface FirecrawlCrawlResponse {
  success: boolean
  id?: string
  error?: string
}

interface FirecrawlStatusResponse {
  status: string
  data?: FirecrawlPage[]
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────
function extractPhone(text: string): string {
  const m = text.match(/\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/)
  return m ? m[0].trim() : ''
}

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return m ? m[0].trim() : ''
}

function extractColors(text: string): { primary: string; accent: string } {
  const hexMatches = [...text.matchAll(/#([0-9a-fA-F]{6})\b/g)].map(m => `#${m[1]}`)
  const filtered = hexMatches.filter(c => {
    const hex = c.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    // Skip near-white and near-black
    const lum = (r + g + b) / 3
    return lum > 30 && lum < 220
  })
  return { primary: filtered[0] || '#10b981', accent: filtered[1] || '#f5c518' }
}

function extractServices(text: string): string[] {
  const serviceKeywords = [
    'ant', 'roach', 'cockroach', 'termite', 'rodent', 'mice', 'rat', 'mosquito',
    'bed bug', 'spider', 'wasp', 'hornet', 'flea', 'tick', 'scorpion', 'wildlife',
    'pest control', 'extermination', 'fumigation', 'inspection', 'treatment',
  ]
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 120)
  const services: string[] = []
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (serviceKeywords.some(kw => lower.includes(kw))) {
      const clean = line.replace(/^[#*\-•>\s]+/, '').trim()
      if (clean.length > 3 && !services.includes(clean)) services.push(clean)
    }
    if (services.length >= 12) break
  }
  return services
}

function extractAbout(text: string): string {
  const patterns = [/about us[\s\S]{0,2000}/i, /who we are[\s\S]{0,2000}/i, /our story[\s\S]{0,2000}/i]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      return m[0]
        .replace(/^(about us|who we are|our story)[^\n]*/i, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, 600)
    }
  }
  // Fall back to first substantial paragraph
  const paras = text.split('\n\n').filter(p => p.length > 100)
  return paras[0]?.trim().slice(0, 600) || ''
}

function extractHero(text: string): { headline: string; subheadline: string } {
  const lines = text.split('\n').map(l => l.replace(/^[#*\->\s]+/, '').trim()).filter(l => l.length > 10 && l.length < 120)
  return {
    headline: lines[0] || '',
    subheadline: lines[1] || '',
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
  console.log(`\n🔍 Starting crawl of ${siteUrl} ...`)

  // Scrape homepage directly first (better JS rendering + metadata)
  console.log('  Scraping homepage...')
  const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: siteUrl, formats: ['markdown'], waitFor: 2000 }),
  })
  const scrapeData = await scrapeRes.json() as { success?: boolean; data?: FirecrawlPage; markdown?: string; metadata?: FirecrawlPage['metadata'] }
  const homePage: FirecrawlPage = scrapeData.data || { url: siteUrl, markdown: scrapeData.markdown || '', metadata: scrapeData.metadata }

  // Start crawl for additional pages
  const crawlRes = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: siteUrl, limit: 10, scrapeOptions: { formats: ['markdown'], waitFor: 2000 } }),
  })
  const crawlData: FirecrawlCrawlResponse = await crawlRes.json()

  if (!crawlData.success || !crawlData.id) {
    console.error('Crawl failed to start:', crawlData.error || JSON.stringify(crawlData))
    process.exit(1)
  }

  console.log(`  Crawl started. Job ID: ${crawlData.id}`)

  // Poll for completion
  let pages: FirecrawlPage[] = [homePage]
  for (let i = 0; i < 30; i++) {
    await sleep(3000)
    const statusRes = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlData.id}`, {
      headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` },
    })
    const statusData: FirecrawlStatusResponse = await statusRes.json()
    process.stdout.write(`  Status: ${statusData.status} (${statusData.data?.length || 0} pages)...\r`)

    if (statusData.status === 'completed') {
      pages = [homePage, ...(statusData.data || [])]
      console.log(`\n  ✓ Crawl complete — ${pages.length} pages collected`)
      break
    }
    if (statusData.status === 'failed') {
      console.error('\nCrawl failed:', statusData.error)
      process.exit(1)
    }
  }

  // Filter out error pages (403/404 responses that Firecrawl still returns)
  const cleanPages = pages.filter(p => {
    const md = (p.markdown || '').trim().toLowerCase()
    return md.length > 100 && !md.startsWith('403') && !md.startsWith('404') && !md.includes('access denied')
  })
  const usablePages = cleanPages.length > 0 ? cleanPages : pages

  // Combine all markdown
  const allText = usablePages.map(p => p.markdown || '').join('\n\n---\n\n')
  const homeText = (homePage.markdown || '').trim().toLowerCase().startsWith('403')
    ? usablePages[0]?.markdown || allText
    : homePage.markdown || allText

  // Extract content
  const phone = extractPhone(allText)
  const email = extractEmail(allText)
  const colors = extractColors(allText)
  const services = extractServices(allText)
  const about = extractAbout(allText)
  const hero = extractHero(homeText)

  // Company name from page title (strip site tagline after dash/pipe)
  const rawTitle = homePage.metadata?.title || pages[0]?.metadata?.title || ''
  const companyName = rawTitle
    ? rawTitle.replace(/\s*[-|–—].*$/, '').replace(/\s*(home|pest control|exterminator)\s*$/i, '').trim() || rawTitle.trim()
    : slug

  // Build address from text (best-effort)
  const addressMatch = allText.match(/\d+\s+[A-Z][a-z]+[\w\s,]+(?:TX|FL|CA|GA|AZ|OH|NC|TN|WA|CO|IL|PA|NY|VA)\s*\d{5}/i)
  const address = addressMatch ? addressMatch[0].trim() : ''

  // Build tagline
  const taglineMatch = allText.match(/(?:our mission|tagline|slogan)[:\s]+([^\n]{10,80})/i)
  const tagline = taglineMatch ? taglineMatch[1].trim() : hero.subheadline

  // Write output file
  const outputDir = path.join(process.cwd(), 'scripts', 'output')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${slug}-content.md`)

  const content = `# ${companyName} — Migration Content

## Business Info
name: ${companyName}
phone: ${phone}
address: ${address}
email: ${email}
tagline: ${tagline}

## Hero Copy
headline: ${hero.headline}
subheadline: ${hero.subheadline}

## Services
${services.map(s => `- ${s}`).join('\n') || '- (none extracted — review manually)'}

## About
${about || '(none extracted — review manually)'}

## Colors
primary: ${colors.primary}
accent: ${colors.accent}

## Source URL
${siteUrl}
`

  fs.writeFileSync(outputPath, content, 'utf8')
  console.log(`\n✅ Output written to: ${outputPath}`)
  console.log('\n--- Preview ---')
  console.log(content.slice(0, 800))
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
