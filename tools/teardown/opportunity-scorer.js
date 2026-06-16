const { chromium } = require('playwright');

/*
  IRONWOOD OPPORTUNITY SCORER v0.3
  HIGH score = better target. Hunts the "Blue Duck pattern":
  paying a vendor, dated WP stack, slow, thin conversion, hidden SEO.
  Must throw back genuinely well-served sites (Orkin-style).

  v0.3 — three gaps closed against Tops Pest Control (topspest.com) ground truth:
    FIX 1: detect hosted site builders (Wix/Squarespace/GoDaddy/Duda), not just WordPress.
           Tops is on Wix; v0.2 scored it stack="Other/Unknown" = 0 stack points (mis-tiered D).
    FIX 2: kill vendor-credit false positives from platform boilerplate.
           v0.2 read Wix's own "Website Builder" footer text as a paid agency credit (+8).
    FIX 3: detect placeholder/template leftovers — e.g. a live "(222) 222-2222" phone next
           to a CTA. v0.2 had no concept of unreplaced template values (highest-value tell).
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

  // v0.3 fix: hosted site builders are a DIFFERENT but equally valid Blue-Duck signal (rented
  // presence, no automation extensibility, builder bloat). v0.2 let these fall through to Unknown.
  const isWix = /\.wix\.com|wix-instantsearch|X-Wix-|static\.parastorage\.com/i.test(html)
             || /name=["']generator["'][^>]*Wix\.com Website Builder/i.test(html);
  const isSquarespace = /static1\.squarespace\.com|squarespace\.com/i.test(html)
                     || /name=["']generator["'][^>]*Squarespace/i.test(html);
  const isDuda = /\.multiscreensite\.com|dudamobile|duda/i.test(html);
  // GoDaddy: a bare generator "Website Builder" is ambiguous, so only count it when corroborated
  // by a real GoDaddy/Duda host signal (this is the same string Fix 2 denylists from vendor credit).
  const isGoDaddy = /img\.cdn4dd|godaddy|websitebuilder|w\.sharedcount/i.test(html)
                 || (/name=["']generator["'][^>]*Website Builder/i.test(html)
                     && /godaddy|img\.cdn4dd|\.multiscreensite\.com/i.test(html));
  const isModern = /__next|_next\/static|data-reactroot|__nuxt|svelte-/i.test(html);

  const hostedBuilder = isWix ? 'Wix' : isSquarespace ? 'Squarespace' : isGoDaddy ? 'GoDaddy' : isDuda ? 'Duda' : null;
  signals.platform = isWP ? 'WordPress' : hostedBuilder ? hostedBuilder : isModern ? 'Modern JS framework' : 'Other/Unknown';
  // signals.stack kept for back-compat — same detection, with WP version appended when known
  signals.stack = isWP ? 'WordPress' + (wpVer ? ` ${wpVer[1]}` : '') : signals.platform;
  signals.pageBuilders = builders;

  if (isWP) {
    score += 25;
    evidence.push(`Running WordPress${wpVer?' '+wpVer[1]:''}${builders.length?' + '+builders.join('/'):''} — heavy, dated stack we replace with Next.js (Dang pattern)`);
    if (builders.length) { score += 10; evidence.push(`Page-builder bloat (${builders.join(', ')}) — performance tax, easy speed win on rebuild`); }
  } else if (hostedBuilder) {
    score += 20;
    evidence.push(`Built on ${hostedBuilder} — a hosted site builder; presence is rented and cannot be extended into an automation platform (the PestFlow Pro angle)`);
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
  // v0.3 false-positive fix: a credit only counts when it looks like a real agency/person, NEVER
  // a platform's own footer boilerplate (e.g. Wix's "Website Builder"). Those prove nothing about
  // willingness-to-pay, so they must not earn the +8. Denylisted phrases are discarded outright.
  const vc = html.match(/(?:web design|website|digital marketing|powered by|site by|developed by)\s*(?:&[^;]+;|by)?\s*[A-Z][\w .,'&-]{2,40}/i);
  const PLATFORM_BOILERPLATE = /^\s*(?:website builder|wix(?:\.com)?|squarespace|godaddy|duda|powered by shopify|wordpress\.com)\b/i;
  if (vc) {
    const candidate = vc[0].replace(/\s+/g,' ').trim().slice(0,80);
    if (!PLATFORM_BOILERPLATE.test(candidate)) {
      signals.vendorCredit = candidate; score += 8;
      evidence.push(`Vendor credited in footer ("${signals.vendorCredit}") — already PAYING someone; willingness-to-pay proven, delivery is the gap`);
    }
    // else: platform boilerplate (e.g. "Website Builder"), not a paid vendor — discarded, no points
  }

  // 6. PLACEHOLDER / TEMPLATE-LEFTOVER SCAN (v0.3 new) — unreplaced template values are some of the
  // most persuasive findings in a sales conversation (e.g. a live "(222) 222-2222" next to a CTA
  // is directly costing real calls). v0.2 had no concept of this and missed it entirely.
  const visibleText = await page.evaluate(() => document.body.innerText || '');
  const placeholders = []; let placeholderScore = 0;

  // Placeholder phone numbers — the single highest-value tell (it leaks calls): +15
  const phonePlaceholders = [
    /\(?2{3}\)?[\s.-]?2{3}[\s.-]?2{2,4}/,        // (222) 222-2222 / 222-222-222
    /\(?123\)?[\s.-]?456[\s.-]?7890/,            // 123-456-7890
    /\(?555\)?[\s.-]?555[\s.-]?5555/,            // 555-555-5555
    /555[\s.-]?01\d\d/,                          // 555-01xx reserved range
  ];
  let phoneHit = null;
  for (const re of phonePlaceholders) { const m = visibleText.match(re) || html.match(re); if (m) { phoneHit = m[0].trim(); break; } }
  if (phoneHit) {
    placeholders.push(`placeholder phone: ${phoneHit}`); placeholderScore += 15;
    evidence.push(`Live PLACEHOLDER PHONE NUMBER on the page ("${phoneHit}") — an unreplaced template value sitting next to a CTA, directly costing real calls`);
  }

  // Other template leftovers: +8 each
  const otherPlaceholders = [
    { re: /lorem ipsum/i,                                          label: 'Lorem ipsum filler text',                         hay: 'both' },
    { re: /\[(your|company|business|phone|email|address)[^\]]*\]/i, label: 'literal bracket placeholder (e.g. "[Your Company]")', hay: 'both' },
    { re: /\byour-?(company|business|domain)\b/i,                  label: 'unreplaced "your-company/business/domain" text',  hay: 'both' },
    { re: /\[email protected\]/i,                                  label: 'literal "[email protected]" left in markup',       hay: 'both' },
    { re: /insert\s+[\w ]{1,20}\s+here/i,                          label: 'leftover "Insert … here" instruction',            hay: 'both' },
    { re: /example\.com/i,                                         label: 'placeholder "example.com" in visible contact text', hay: 'visible' },
  ];
  for (const p of otherPlaceholders) {
    const hay = p.hay === 'visible' ? visibleText : visibleText + '\n' + html;
    if (p.re.test(hay)) {
      placeholders.push(p.label); placeholderScore += 8;
      evidence.push(`Template leftover: ${p.label} — unfinished/templated content that undermines trust and signals neglect`);
    }
  }

  if (placeholderScore > 20) placeholderScore = 20; // cap: one messy page can't dominate the score
  score += placeholderScore;
  signals.placeholders = placeholders;

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
