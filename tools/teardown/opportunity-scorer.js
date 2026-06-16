const { chromium } = require('playwright');

/*
  IRONWOOD OPPORTUNITY SCORER v0.2
  HIGH score = better target. Hunts the "Blue Duck pattern":
  paying a vendor, dated WP stack, slow, thin conversion, hidden SEO.
  Must throw back genuinely well-served sites (Orkin-style).
*/
async function scoreSite(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  let mainHeaders = {};
  page.on('response', (resp) => {
    if (resp.url().replace(/\/$/, '') === url.replace(/\/$/, '')) mainHeaders = resp.headers();
  });

  const t0 = Date.now();
  try { await page.goto(url, { waitUntil: 'load', timeout: 35000 }); }
  catch (e) { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 }).catch(()=>{}); }
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  const html = await page.content();

  const signals = {}; const evidence = []; let score = 0;

  // 1. STACK FINGERPRINT — tightened to REAL paths, not loose string matches (v0.2 fix)
  const isWP = /\/wp-content\/(themes|plugins)\//i.test(html) || /\/wp-includes\//i.test(html)
            || /name=["']generator["'][^>]*WordPress/i.test(html);
  const wpVer = html.match(/content=["']WordPress\s+([\d.]+)/i);
  const builders = [];
  if (/\/wp-content\/plugins\/elementor\//i.test(html)) builders.push('Elementor');
  if (/\/wp-content\/plugins\/js_composer\//i.test(html)) builders.push('WPBakery');
  if (/\/wp-content\/themes\/Divi\//i.test(html)) builders.push('Divi');
  const isModern = /__next|_next\/static|data-reactroot|__nuxt|svelte-/i.test(html);

  signals.stack = isWP ? 'WordPress' + (wpVer ? ` ${wpVer[1]}` : '') : isModern ? 'Modern JS framework' : 'Other/Unknown';
  signals.pageBuilders = builders;

  if (isWP) {
    score += 25;
    evidence.push(`Running WordPress${wpVer?' '+wpVer[1]:''}${builders.length?' + '+builders.join('/'):''} — heavy, dated stack we replace with Next.js (Dang pattern)`);
    if (builders.length) { score += 10; evidence.push(`Page-builder bloat (${builders.join(', ')}) — performance tax, easy speed win on rebuild`); }
  } else if (isModern) { score -= 15; evidence.push(`Already on a modern JS framework — likely well-served, lower rebuild upside`); }

  // 2. REAL PERFORMANCE
  const perf = await page.evaluate(() => {
    const res = performance.getEntriesByType('resource') || [];
    return { requests: res.length, totalKB: Math.round(res.reduce((s,r)=>s+(r.transferSize||0),0)/1024),
             imgCount: res.filter(r=>r.initiatorType==='img').length, scriptCount: res.filter(r=>r.initiatorType==='script').length };
  });
  signals.perf = { ...perf, wallClockMs: loadMs };
  if (loadMs > 4000) { score += 15; evidence.push(`Slow load: ${(loadMs/1000).toFixed(1)}s — bleeding mobile visitors & SEO rank`); }
  else if (loadMs > 2500) { score += 8; evidence.push(`Sluggish load: ${(loadMs/1000).toFixed(1)}s`); }
  if (perf.totalKB > 4000) { score += 10; evidence.push(`Heavy page weight: ${(perf.totalKB/1024).toFixed(1)} MB — Next.js rebuild cuts this hard`); }
  if (perf.requests > 90 && isWP) { score += 5; evidence.push(`${perf.requests} requests — plugin request-bloat`); }

  // 3. CONVERSION SURFACE
  const convWords = ['book','schedule','appointment','request','quote','estimate','get started','contact','sign up'];
  let convCount = 0;
  for (const w of convWords) convCount += await page.getByRole('link',{name:new RegExp(w,'i')}).count() + await page.getByRole('button',{name:new RegExp(w,'i')}).count();
  const hasOnlineBooking = /(calendly|acuity|housecallpro|jobber|servicetitan|book.*online|schedule.*online)/i.test(html);
  signals.conversion = { ctaCount: convCount, hasOnlineBooking };
  if (convCount <= 3) { score += 15; evidence.push(`Thin conversion surface (~${convCount} CTA) — likely one quote button doing all the work (Blue Duck pattern)`); }
  if (!hasOnlineBooking) { score += 8; evidence.push(`No online booking integration — leads must phone in, leaking after-hours demand`); }

  // 4. SEO TRANSPARENCY & HEALTH
  const hasSchema = /application\/ld\+json/i.test(html);
  const hasMetaDesc = /<meta[^>]+name=["']description["']/i.test(html);
  const h1Count = (html.match(/<h1[\s>]/gi)||[]).length;
  const hasGA = /(googletagmanager|gtag\(|google-analytics)/i.test(html);
  const hasGSC = /google-site-verification/i.test(html);
  signals.seo = { hasSchema, hasMetaDesc, h1Count, hasGA, hasGSC };
  if (!hasSchema) { score += 10; evidence.push(`No LocalBusiness structured data — invisible to AI search & rich results`); }
  if (!hasMetaDesc) { score += 5; evidence.push(`Missing meta description`); }
  if (h1Count !== 1) { score += 4; evidence.push(`${h1Count} H1 tags (should be 1)`); }
  if (hasGA && !hasGSC) { score += 6; evidence.push(`Analytics present but no owner search-console verification — classic "vendor holds the keys" tell`); }

  // 5. VENDOR-LOCK TELL — cleaned extraction (v0.2 fix)
  const vc = html.match(/(?:web design|website|digital marketing|powered by|site by|developed by)\s*(?:&[^;]+;|by)?\s*[A-Z][\w .,'&-]{2,40}/i);
  if (vc) { signals.vendorCredit = vc[0].replace(/\s+/g,' ').trim().slice(0,80); score += 8;
    evidence.push(`Vendor credited in footer ("${signals.vendorCredit}") — already PAYING someone; willingness-to-pay proven, delivery is the gap`); }

  await browser.close();

  let tier, pitch;
  if (score >= 70) { tier='A — PRIME TARGET'; pitch='Technical + competitive teardown (stack/speed/SEO + Dang before-after)'; }
  else if (score >= 45) { tier='B — STRONG'; pitch='Evidence-based outreach: show the numbers they cannot see'; }
  else if (score >= 25) { tier='C — WORTH A LOOK'; pitch='Soft touch / nurture'; }
  else { tier='D — SKIP / WELL-SERVED'; pitch='Do NOT send a teardown — would damage credibility'; }

  return { url, score, tier, recommendedPitch: pitch, signals, evidence };
}

(async () => {
  const url = process.argv[2];
  if (!url) { console.error('Usage: node opportunity-scorer.js <url>'); process.exit(1); }
  console.log(JSON.stringify(await scoreSite(url), null, 2));
})();
