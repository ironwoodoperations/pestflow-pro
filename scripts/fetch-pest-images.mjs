import fs from 'fs'
import path from 'path'
import https from 'https'

const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) throw new Error('Missing PEXELS_API_KEY in environment')

const OUTPUT_DIR = 'public/images/pests'
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const images = [
  { query: 'spider close up macro',           file: 'spider.jpg' },
  { query: 'mosquito insect macro',           file: 'mosquito.jpg' },
  { query: 'ant colony insect',               file: 'ant.jpg' },
  { query: 'wasp nest insect',                file: 'wasp.jpg' },
  { query: 'cockroach insect',                file: 'roach.jpg' },
  { query: 'flea insect macro',               file: 'flea.jpg' },
  { query: 'mouse rodent',                    file: 'rodent.jpg' },
  { query: 'scorpion arachnid',               file: 'scorpion.jpg' },
  { query: 'bed bug insect macro',            file: 'bedbug.jpg' },
  { query: 'termite colony wood',             file: 'termite.jpg' },
  { query: 'pest control professional spray', file: 'pest-control.jpg' },
  { query: 'pest control team uniform',       file: 'team.jpg' },
  { query: 'exterminator professional work',  file: 'exterminator.jpg' },
  { query: 'pest control truck service',      file: 'hero.jpg' },
  { query: 'happy family home safe',          file: 'family.jpg' },
  { query: 'clean modern home interior',      file: 'home.jpg' },
]

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, r => r.pipe(file))
      } else {
        res.pipe(file)
      }
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  })
}

async function fetchImage(query, filename) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: API_KEY } })
  const data = await res.json()
  if (!data.photos?.length) { console.log(`⚠️  No result for: ${query}`); return }
  const photo = data.photos[0]
  const imageUrl = photo.src.large2x || photo.src.large
  const dest = path.join(OUTPUT_DIR, filename)
  await download(imageUrl, dest)
  console.log(`✅  ${filename} — "${photo.alt || query}" by ${photo.photographer}`)
}

for (const { query, file } of images) {
  await fetchImage(query, file)
  await new Promise(r => setTimeout(r, 300)) // gentle rate limit
}

console.log('\n🎉 All images downloaded to', OUTPUT_DIR)
