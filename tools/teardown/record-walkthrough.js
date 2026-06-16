const { chromium } = require('playwright');
const fs = require('fs');

async function record(url, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    recordVideo: { dir: outDir, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  try { await page.goto(url, { waitUntil: 'load', timeout: 35000 }); }
  catch { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(()=>{}); }
  await page.waitForTimeout(1500);

  // dismiss the popup that breaks naive recorders
  for (const sel of ['button:has-text("Accept")','button:has-text("Got it")','[aria-label="Close"]','#onetrust-accept-btn-handler']) {
    const el = page.locator(sel).first();
    if (await el.count() && await el.isVisible().catch(()=>false)) { await el.click().catch(()=>{}); break; }
  }
  // scripted scroll walkthrough
  const h = await page.evaluate(() => document.body.scrollHeight);
  // v0.3 fix: dwell 2500ms/step so the clip reliably clears ~15s. v0.2's 1200ms produced a 7.6s
  // video, so run.sh's frames at 10s/14s landed past the end (only 2 of 4 extracted; spec needs >=3).
  for (let i = 1; i <= 5; i++) { await page.evaluate(y => window.scrollTo({top:y,behavior:'smooth'}), (h/5)*i); await page.waitForTimeout(2500); }
  await page.evaluate(() => window.scrollTo({top:0,behavior:'smooth'})); await page.waitForTimeout(1000);
  await context.close(); await browser.close();
  return fs.readdirSync(outDir).find(f => f.endsWith('.webm'));
}

(async () => {
  const [url, outDir] = [process.argv[2], process.argv[3] || './output'];
  const file = await record(url, outDir);
  console.log('VIDEO:', outDir + '/' + file);
})();
