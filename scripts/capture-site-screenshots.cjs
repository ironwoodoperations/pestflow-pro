const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SITES = [
  { url: 'https://lone-star-pest-solutions.pestflowpro.com', file: 'lone-star-site.jpg' },
  { url: 'https://dang.pestflowpro.com',                     file: 'dang-site.jpg'      },
  { url: 'https://pestflow-pro.pestflowpro.com',             file: 'demo-site.jpg'      },
];

const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'sites');
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });

  for (const site of SITES) {
    console.log(`Capturing ${site.url}...`);
    const page = await browser.newPage();
    try {
      await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      const outPath = path.join(OUT_DIR, site.file);
      await page.screenshot({ path: outPath, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1280, height: 800 } });
      console.log(`  Saved → public/images/sites/${site.file}`);
    } catch (err) {
      console.error(`  ERROR capturing ${site.url}:`, err.message);
    }
    await page.close();
  }

  await browser.close();
  console.log('Done.');
})();
