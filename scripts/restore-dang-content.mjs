#!/usr/bin/env node
// Restore Dang Pest Control page content from live site via Firecrawl.
// Only updates title, subtitle, intro in page_content — nothing else.
// Run: doppler run -- node scripts/restore-dang-content.mjs

const FIRECRAWL_API_KEY       = process.env.FIRECRAWL_API_KEY
const SUPABASE_URL            = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const TENANT_ID = '1611b16f-381b-4d4f-ba3a-fbde56ad425b'

if (!FIRECRAWL_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Run via: doppler run -- node scripts/restore-dang-content.mjs')
  process.exit(1)
}

const PAGES = [
  { slug: 'about',               urls: ['https://www.dangpestcontrol.com/about-us/', 'https://www.dangpestcontrol.com/about/'] },
  { slug: 'ant-control',         urls: ['https://www.dangpestcontrol.com/ant-control/'] },
  { slug: 'bed-bug-control',     urls: ['https://www.dangpestcontrol.com/bed-bug-control/'] },
  { slug: 'faq',                 urls: ['https://www.dangpestcontrol.com/faq/'] },
  { slug: 'flea-tick-control',   urls: ['https://www.dangpestcontrol.com/flea-tick-control/', 'https://www.dangpestcontrol.com/flea-tick/'] },
  { slug: 'mosquito-control',    urls: ['https://www.dangpestcontrol.com/mosquito-control/'] },
  { slug: 'pest-control',        urls: ['https://www.dangpestcontrol.com/pest-control/'] },
  { slug: 'roach-control',       urls: ['https://www.dangpestcontrol.com/roach-control/', 'https://www.dangpestcontrol.com/cockroach-control/'] },
  { slug: 'rodent-control',      urls: ['https://www.dangpestcontrol.com/rodent-control/'] },
  { slug: 'scorpion-control',    urls: ['https://www.dangpestcontrol.com/scorpion-control/'] },
  { slug: 'spider-control',      urls: ['https://www.dangpestcontrol.com/spider-control/'] },
  { slug: 'termite-control',     urls: ['https://www.dangpestcontrol.com/termite-control/'] },
  { slug: 'termite-inspections', urls: ['https://www.dangpestcontrol.com/termite-inspections/', 'https://www.dangpestcontrol.com/termite-inspection/'] },
]

// Scrape a URL with Firecrawl, return markdown string or null
async function scrapeUrl(url) {
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    })
    const data = await res.json()
    if (!data.success || !data.data?.markdown) return null
    return data.data.markdown
  } catch (err) {
    console.error(`  Firecrawl error for ${url}:`, err.message)
    return null
  }
}

// Extract clean title, subtitle, intro from Firecrawl markdown
function extractContent(markdown, slug) {
  // Remove skip-to-content links entirely
  let text = markdown.replace(/\[Skip to content\]\([^)]+\)/gi, '')

  const lines = text.split('\n').map(l => l.trim())

  // Find first H1
  let h1Idx = lines.findIndex(l => /^#\s+/.test(l) && !l.startsWith('##'))
  if (h1Idx < 0) h1Idx = 0

  // Extract raw title
  let title = lines[h1Idx]?.replace(/^#+\s*/, '').trim() || ''
  // Strip "| Dang Pest Control" or "- Dang Pest Control" suffixes
  title = title.replace(/\s*[\|–\-]\s*Dang Pest Control.*$/i, '').trim()
  // If title looks like a 404 or nav item, it's garbage
  if (/page not found|404|skip to/i.test(title)) {
    return null // signal bad page
  }

  // Collect body paragraphs after H1
  const bodyLines = lines.slice(h1Idx + 1)
  const paragraphs = []

  for (const line of bodyLines) {
    if (!line) continue
    // Stop at sub-headings that signal a new section (like Our Services, FAQ headers, etc.)
    if (/^##/.test(line)) {
      if (paragraphs.length >= 2) break
      continue
    }
    // Skip pure link lines (nav items, menu items)
    if (/^\[.+\]\(.+\)$/.test(line)) continue
    // Skip very short lines (phone numbers, labels, etc.)
    if (line.length < 30) continue
    // Stop at footer patterns
    if (/copyright|all rights reserved|privacy policy|sitemap|powered by/i.test(line)) break
    // Clean inline markdown links — keep text, drop URL
    const clean = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim()
    if (clean.length < 25) continue
    paragraphs.push(clean)
    if (paragraphs.length >= 4) break
  }

  const subtitle = paragraphs[0] || ''
  // Join first 3 paragraphs for intro, keep reasonable length
  const intro = paragraphs.slice(0, 3).join(' ').slice(0, 1200)

  return { title, subtitle, intro }
}

// Update a page_content row in Supabase (only title, subtitle, intro)
async function updatePageContent(slug, title, subtitle, intro) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/page_content?tenant_id=eq.${TENANT_ID}&page_slug=eq.${slug}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ title, subtitle, intro }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PATCH failed (${res.status}): ${text}`)
  }
}

// Main
async function main() {
  console.log('=== Restore Dang page content ===\n')

  const results = []

  for (const page of PAGES) {
    console.log(`\n[${page.slug}]`)
    let markdown = null

    for (const url of page.urls) {
      console.log(`  Scraping: ${url}`)
      markdown = await scrapeUrl(url)
      if (markdown) {
        console.log(`  Got ${markdown.length} chars`)
        break
      }
      console.log(`  → No content, trying next URL...`)
    }

    if (!markdown) {
      console.log(`  SKIPPED — all URLs returned no content`)
      results.push({ slug: page.slug, status: 'skipped', reason: 'no content from any URL' })
      continue
    }

    const extracted = extractContent(markdown, page.slug)
    if (!extracted) {
      console.log(`  SKIPPED — extracted content looks like a 404 or garbage`)
      results.push({ slug: page.slug, status: 'skipped', reason: 'bad content (404 or nav garbage)' })
      continue
    }

    const { title, subtitle, intro } = extracted
    console.log(`  title:    ${title.slice(0, 70)}`)
    console.log(`  subtitle: ${subtitle.slice(0, 70)}`)
    console.log(`  intro:    ${intro.slice(0, 100)}...`)

    // Sanity check — intro must not contain skip-to-content artifact
    if (/skip to content/i.test(intro) || /^\[/.test(intro)) {
      console.log(`  SKIPPED — intro still looks like garbage`)
      results.push({ slug: page.slug, status: 'skipped', reason: 'intro contains artifact text' })
      continue
    }

    try {
      await updatePageContent(page.slug, title, subtitle, intro)
      console.log(`  ✓ Updated`)
      results.push({ slug: page.slug, status: 'updated', title })
    } catch (err) {
      console.error(`  ERROR updating DB:`, err.message)
      results.push({ slug: page.slug, status: 'error', reason: err.message })
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 800))
  }

  console.log('\n=== Summary ===')
  for (const r of results) {
    const icon = r.status === 'updated' ? '✓' : r.status === 'skipped' ? '⚠' : '✗'
    console.log(`${icon} ${r.slug}: ${r.status}${r.reason ? ' — ' + r.reason : ''}${r.title ? ' — ' + r.title : ''}`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
