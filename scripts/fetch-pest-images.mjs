/**
 * Fetch pest control stock images from Pexels API.
 *
 * Get a free API key at: https://www.pexels.com/api/
 *
 * USAGE:
 *   PEXELS_API_KEY=your-key node scripts/fetch-pest-images.mjs
 *
 * Images are saved to public/images/pests/
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'images', 'pests')

const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) {
  console.error('Set PEXELS_API_KEY env var. Get a free key at https://www.pexels.com/api/')
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const QUERIES = [
  { name: 'spider', query: 'spider close up' },
  { name: 'mosquito', query: 'mosquito insect' },
  { name: 'ant', query: 'ant colony' },
  { name: 'wasp', query: 'wasp nest' },
  { name: 'roach', query: 'cockroach insect' },
  { name: 'flea', query: 'flea insect' },
  { name: 'rodent', query: 'mouse rodent' },
  { name: 'scorpion', query: 'scorpion arachnid' },
  { name: 'bedbug', query: 'bed bug insect' },
  { name: 'termite', query: 'termite colony' },
  { name: 'pest-control', query: 'pest control professional' },
  { name: 'team', query: 'pest control team uniform' },
  { name: 'exterminator', query: 'professional exterminator' },
  { name: 'hero-truck', query: 'pest control truck' },
]

for (const { name, query } of QUERIES) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
    const res = await fetch(url, { headers: { Authorization: API_KEY } })
    const data = await res.json()
    const photo = data?.photos?.[0]
    if (!photo) { console.warn(`  ✗ ${name}: no results for "${query}"`); continue }

    const imgUrl = photo.src.large2x || photo.src.large || photo.src.original
    const imgRes = await fetch(imgUrl)
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    const outPath = join(OUT_DIR, `${name}.jpg`)
    writeFileSync(outPath, buffer)
    console.log(`  ✓ ${name}.jpg (${(buffer.length / 1024).toFixed(0)}KB) — ${photo.photographer}`)
  } catch (err) {
    console.warn(`  ✗ ${name}: ${err.message}`)
  }
}

console.log('\nDone! Images saved to public/images/pests/')
console.log('Note: Pexels images require attribution. See https://www.pexels.com/license/')
