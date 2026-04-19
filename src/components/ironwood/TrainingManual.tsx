// Training Manual — PestFlow Pro
// Full-page document with sticky TOC sidebar + scrollable content

const NAV_SECTIONS = [
  { id: 's0', label: '0. Welcome' },
  { id: 's1', label: '1. Pricing' },
  { id: 's2', label: '2. Client Journey' },
  { id: 's3', label: '3. Path A — Template' },
  { id: 's4', label: '4. Path B — Firecrawl' },
  { id: 's5', label: '5. Path C — Elite Build' },
  { id: 's6', label: '6. Common Mistakes' },
  { id: 's7', label: '7. Quick Reference' },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ id, number, title }: { id: string; number: string; title: string }) {
  return (
    <div id={id} className="pt-2 pb-4 border-b border-gray-700 mb-6">
      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{number}</span>
      <h2 className="text-2xl font-bold text-white mt-1">{title}</h2>
    </div>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-emerald-300 mt-6 mb-3">{children}</h3>
}

function StepBlock({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">
        {num}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white mb-1">{title}</p>
        <div className="text-sm text-gray-300 space-y-1">{children}</div>
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-gray-300">
      <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
      <span>{children}</span>
    </li>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-950/60 border border-blue-800 rounded-lg p-4 text-sm text-blue-200 my-4">
      {children}
    </div>
  )
}

// ─── Section 1: Pricing ───────────────────────────────────────────────────────

const BUILD_TIERS = [
  { name: 'Starter',  fee: '$0 – $1,000',    color: 'border-gray-600', badge: 'bg-gray-700', desc: 'Template website, no existing site needed, fastest launch' },
  { name: 'Growth',   fee: '$1,000 – $1,500', color: 'border-blue-700', badge: 'bg-blue-800',  desc: 'Template + content migration from existing site' },
  { name: 'Pro',      fee: '$2,000 – $3,500', color: 'border-purple-700', badge: 'bg-purple-800', desc: 'Firecrawl migration + redirect map + city pages' },
  { name: 'Elite',    fee: '$4,000 – $10,000',color: 'border-amber-600', badge: 'bg-amber-700', desc: 'Full custom shell built by Claude Code, matches brand exactly' },
]

const SUBSCRIPTION_TIERS = [
  { name: 'Starter', price: '$149/mo', features: 'Website, CRM, basic SEO, lead forms',                                            color: 'border-gray-600',    badge: 'bg-gray-700' },
  { name: 'Growth',  price: '$249/mo', features: 'Everything in Starter + blog, social scheduling, reviews page',                   color: 'border-blue-700',   badge: 'bg-blue-800' },
  { name: 'Pro',     price: '$349/mo', features: 'Everything in Growth + city pages, redirect map, priority support',              color: 'border-purple-700', badge: 'bg-purple-800' },
  { name: 'Elite',   price: '$499/mo', features: 'Everything in Pro + custom shell, AI chat, full white-glove service',            color: 'border-amber-600',  badge: 'bg-amber-700' },
]

function PricingSection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s1" number="Section 1" title="Pricing — What We Sell" />

      <H3>Website Build Tiers (One-Time Setup Fee)</H3>
      <div className="grid grid-cols-2 gap-3 mb-8 xl:grid-cols-4">
        {BUILD_TIERS.map(t => (
          <div key={t.name} className={`border ${t.color} rounded-lg p-4 bg-gray-900`}>
            <span className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded ${t.badge} mb-2`}>{t.name}</span>
            <div className="text-lg font-bold text-white mb-1">{t.fee}</div>
            <p className="text-xs text-gray-400">{t.desc}</p>
          </div>
        ))}
      </div>

      <H3>Monthly Subscription Tiers</H3>
      <div className="grid grid-cols-2 gap-3 mb-6 xl:grid-cols-4">
        {SUBSCRIPTION_TIERS.map(t => (
          <div key={t.name} className={`border ${t.color} rounded-lg p-4 bg-gray-900`}>
            <span className={`inline-block text-xs font-bold text-white px-2 py-0.5 rounded ${t.badge} mb-2`}>{t.name}</span>
            <div className="text-xl font-bold text-white mb-1">{t.price}</div>
            <p className="text-xs text-gray-400">{t.features}</p>
          </div>
        ))}
      </div>

      <InfoBox>
        💡 <strong>Important:</strong> The setup fee and subscription tier do not have to match. A client can
        pay a $4,000 Elite build fee but subscribe at the Growth plan level.
      </InfoBox>
    </div>
  )
}

// ─── Section 2: Client Journey ────────────────────────────────────────────────

const JOURNEY_STEPS = [
  { icon: '📞', label: 'Lead Closed',       desc: 'You close the sale on the phone' },
  { icon: '📋', label: 'Intake Submitted',  desc: 'Client fills out the intake form' },
  { icon: '💳', label: 'Invoice Sent',      desc: 'Setup fee invoice sent via Stripe' },
  { icon: '✅', label: 'Payment Confirmed', desc: 'Client pays' },
  { icon: '🏗️', label: 'Build Ready',       desc: 'You start building the site' },
  { icon: '🔍', label: 'IT In Progress',    desc: 'Site is being built' },
  { icon: '🎯', label: 'Reveal Ready',      desc: 'Site passes QA, ready to show client' },
  { icon: '🚀', label: 'Live',              desc: 'DNS pointed, site is live' },
]

function JourneySection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s2" number="Section 2" title="The Client Journey — Big Picture" />
      <p className="text-sm text-gray-400 mb-6">Each stage has specific tasks. This manual walks through every one.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {JOURNEY_STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center min-w-[110px]">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs font-semibold text-white leading-tight">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.desc}</div>
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <span className="text-gray-600 text-lg font-bold">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section 3: Path A ────────────────────────────────────────────────────────

const TEMPLATES = [
  { name: 'Modern Pro',      color: 'from-blue-900 to-blue-700',   text: 'text-blue-200',   desc: 'Clean, professional, blue/white. Best for established companies.' },
  { name: 'Bold Local',      color: 'from-orange-900 to-orange-700', text: 'text-orange-200', desc: 'Bold, energetic, high contrast. Great for owner-operators.' },
  { name: 'Clean Friendly',  color: 'from-green-900 to-green-700', text: 'text-green-200',  desc: 'Warm, approachable, green tones. Works for family businesses.' },
  { name: 'Rustic Rugged',   color: 'from-amber-900 to-amber-800', text: 'text-amber-200',  desc: 'Earthy, trusted, outdoor feel. Great for rural markets.' },
]

const PATH_A_STEPS = [
  {
    title: 'Create the prospect',
    bullets: [
      'Go to Ironwood → Pipeline',
      'Click "+ New Prospect"',
      'Fill in: Company Name, Contact Name, Phone, Email',
      'Set Salesperson and Onboarding Rep',
      'Set Status to "Paid" once they\'ve paid',
      'Click Save',
    ],
  },
  {
    title: 'Send the intake form',
    bullets: [
      'Scroll to "Intake Link" section in the prospect record',
      'Click "Copy Intake Link"',
      'Send it to the client via email or text',
      'Tell them: "This takes about 10 minutes. Fill it out completely."',
      'The form collects: business info, colors, services, service areas, photos, social links',
      'When they submit, the Intake Link section collapses automatically ✅',
    ],
  },
  {
    title: 'Select the build path',
    bullets: [
      'In the prospect record, find "Build Path"',
      'Select: Template Launch',
      'Select the template: Modern Pro | Bold Local | Clean Friendly | Rustic Rugged',
      'Set the tier: Starter or Growth',
    ],
    extra: true,
  },
  {
    title: 'Send the invoice',
    bullets: [
      'Scroll to "Plan & Payment"',
      'Enter the setup fee amount',
      'Select the subscription plan',
      'Click "Send Invoice" — this sends a Stripe payment link to the client',
      'When sent, the section shows "Invoice sent [date]" ✅',
      'ZAP 3 fires automatically → sends invoice notification',
    ],
  },
  {
    title: 'Wait for payment',
    bullets: [
      'When client pays, Stripe webhook fires',
      'ZAP 4 fires → sends welcome email automatically',
      'Status updates to "Paid" in the prospect record',
      'You can now advance to Build Ready',
    ],
  },
  {
    title: 'Provision the site',
    bullets: [
      'Scroll to "Site Setup" section',
      'Verify: Slug, Admin Email, Admin Password are filled in',
      'Verify: Business Name, Phone, Email are correct',
      'Select the Shell template',
      'Set Primary Color and Accent Color (from intake form)',
      'Click "🚀 Create Site"',
      'Wait ~30 seconds — site provisions automatically',
      'ZAP 5 fires → Teams notification sent ✅',
    ],
  },
  {
    title: 'Content entry',
    bullets: [
      'Go to [slug].pestflowpro.com/admin',
      'Log in with the admin credentials',
      'Go to Content → fill in all service descriptions',
      'Go to Settings → Business Info → fill in address, hours, tagline, license #',
      'Go to Settings → Branding → confirm colors, upload logo if client provided one',
      'Go to Testimonials → add 3–5 reviews',
      'Go to Blog → add 1–2 blog posts (optional)',
    ],
  },
  {
    title: 'SEO setup',
    bullets: [
      'In Ironwood → prospect record → SEO Health Panel',
      'Fill in: Meta Description, Service Areas, Owner Name, Founded Year, Certifications',
      'Click Save SEO Settings',
      'SEO score should reach at least 7/13 before launch',
    ],
  },
  {
    title: 'QA Checklist',
    bullets: [
      '✅ Site is reachable on live or preview URL',
      '✅ Admin login tested and working',
      '✅ Lead form submits successfully',
      '✅ Email notifications firing correctly',
      '✅ SMS notifications firing correctly',
      '✅ Domain connected in Vercel',
      '✅ Mobile layout checked',
      '✅ Content proofed (no placeholders, no "TEST TEST")',
      '✅ Customer credentials package ready',
      '✅ SEO health score ≥ 7/13',
      '✅ sitemap.xml accessible',
      '✅ Legal pages present (/privacy, /terms, /sms-terms)',
      '✅ 301 redirect map complete (if applicable)',
      'When all 13 pass → prospect moves to Reveal Ready automatically',
    ],
  },
  {
    title: 'Reveal call',
    bullets: [
      'Go to Reveal Queue → find the client',
      'Enter the old site\'s PageSpeed scores (if they had a site) in the score inputs',
      'Click "📄 Reveal Report" → review the report',
      'Click "Book Reveal Call" to schedule via M365 Bookings',
      'On the call: walk through the report, show the site, collect feedback',
      'After call: click "Launch Approved" → site goes live',
    ],
  },
  {
    title: 'DNS cutover',
    bullets: [
      'Tell the client to log into their domain registrar',
      'Add these Vercel DNS records: A record and CNAME from Vercel Domains',
      'In Vercel → pestflow-pro project → Domains → Add their custom domain',
      'Wait for propagation (usually 15–30 minutes)',
      'Flip verified = true in Supabase if needed',
      'Site is LIVE 🎉',
    ],
  },
]

function PathASection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s3" number="Section 3" title="Path A — Starter/Growth: Template Client" />

      <InfoBox>
        <strong>Who this is for:</strong> Client has no website OR has a website but we're not migrating it.
        Fastest path to launch. Can be done in under 2 hours.
      </InfoBox>

      {PATH_A_STEPS.map((s, i) => (
        <StepBlock key={i} num={String(i + 1)} title={`STEP ${i + 1} — ${s.title}`}>
          <ul className="space-y-1 mt-1">
            {s.bullets.map((b, j) => <Bullet key={j}>{b}</Bullet>)}
          </ul>
          {s.extra && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">Template Preview</p>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {TEMPLATES.map(t => (
                  <div key={t.name} className={`bg-gradient-to-br ${t.color} rounded-lg p-3`}>
                    <div className={`font-bold text-sm ${t.text} mb-1`}>{t.name}</div>
                    <p className="text-xs text-gray-300 leading-tight">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </StepBlock>
      ))}
    </div>
  )
}

// ─── Section 4: Path B ────────────────────────────────────────────────────────

function PathBSection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s4" number="Section 4" title="Path B — Pro: Firecrawl Migration" />

      <InfoBox>
        <strong>Who this is for:</strong> Client has an existing website we want to migrate content from.
        Firecrawl scrapes their site automatically and pulls in their content. Follow all of Path A,
        plus these additional steps before provisioning.
      </InfoBox>

      <StepBlock num="A" title="STEP A — Scrape the existing site">
        <ul className="space-y-1 mt-1">
          <Bullet>In the prospect record → "Import from Existing Website"</Bullet>
          <Bullet>Enter their current website URL</Bullet>
          <Bullet>Click "Scrape Site"</Bullet>
          <Bullet>Wait 30–60 seconds — Firecrawl extracts all content</Bullet>
          <Bullet>Review the extracted content — check for accuracy</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="B" title="STEP B — Build the redirect map">
        <ul className="space-y-1 mt-1">
          <Bullet>Download Screaming Frog SEO Spider (free at screamingfrog.co.uk)</Bullet>
          <Bullet>Enter the client's current site URL → Start crawl</Bullet>
          <Bullet>When done: File → Export → All Inlinks → Save as CSV</Bullet>
          <Bullet>In the prospect record → 301 Redirect Map → Choose File → upload the CSV</Bullet>
          <Bullet>Rows auto-populate with all their old URLs</Bullet>
          <Bullet>Click "✨ Auto-Map with AI" — Claude maps old URLs to new URLs in ~3 seconds</Bullet>
          <Bullet>Review each row — fix any mismatches</Bullet>
          <Bullet>Old city/location pages should map to /city-tx individual pages (not /service-area)</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="C" title="STEP C — Provision with scraped content">
        <ul className="space-y-1 mt-1">
          <Bullet>Follow the same provisioning steps as Path A (Steps 6–11)</Bullet>
          <Bullet>The scraped content auto-populates the site</Bullet>
        </ul>
      </StepBlock>
    </div>
  )
}

// ─── Section 5: Path C ────────────────────────────────────────────────────────

function PathCSection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s5" number="Section 5" title="Path C — Elite: Full Custom Build (Claude Code)" />

      <InfoBox>
        <strong>Who this is for:</strong> Client needs a completely custom website that matches their existing brand
        exactly. This is our premium offering. Takes 1–3 days.
      </InfoBox>

      <StepBlock num="1–5" title="STEPS 1–5 — Same as Path A">
        <ul className="space-y-1 mt-1">
          <Bullet>Complete intake, invoice, and payment steps exactly as in Path A</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="6" title="STEP 6 — Scrape the existing site">
        <ul className="space-y-1 mt-1">
          <Bullet>Same as Path B Step A — scrape with Firecrawl</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="7" title="STEP 7 — Generate the build prompt">
        <ul className="space-y-1 mt-1">
          <Bullet>In the prospect record → Build Files section</Bullet>
          <Bullet>Click "⚡ Generate Build Files"</Bullet>
          <Bullet>A BUILD_PROMPT.txt file downloads</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="8" title="STEP 8 — Run Claude Code">
        <ul className="space-y-1 mt-1">
          <Bullet>Open GitHub Codespaces for the pestflow-pro repo</Bullet>
          <Bullet>In the terminal run: <code className="bg-gray-950 text-emerald-300 px-1 rounded text-xs">claude --dangerously-skip-permissions {'<'} BUILD_PROMPT.txt</code></Bullet>
          <Bullet>Claude Code builds the entire custom shell in src/shells/[slug]/</Bullet>
          <Bullet>This takes 5–15 minutes</Bullet>
          <Bullet>Claude Code commits and pushes automatically</Bullet>
          <Bullet>Vercel deploys automatically</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="9" title="STEP 9 — Review and refine">
        <ul className="space-y-1 mt-1">
          <Bullet>Visit [slug].pestflowpro.com</Bullet>
          <Bullet>Check every page — hero, services, about, contact, city pages</Bullet>
          <Bullet>If anything needs adjusting, describe it to Claude Code in the chat</Bullet>
          <Bullet>Commit and push each fix</Bullet>
        </ul>
      </StepBlock>

      <StepBlock num="10" title="STEP 10 — QA, Reveal, DNS">
        <ul className="space-y-1 mt-1">
          <Bullet>Same as Path A Steps 9–11</Bullet>
        </ul>
      </StepBlock>
    </div>
  )
}

// ─── Section 6: Common Mistakes ───────────────────────────────────────────────

const MISTAKES = [
  'Never mark "Invoice Sent" before actually sending the invoice',
  'Never provision a site before the intake form is submitted',
  'Never use "TEST TEST" as placeholder content — always use real content',
  'Never skip the QA checklist — all 13 must pass before reveal',
  'Never send DNS instructions before the site passes QA',
  'Never create a redirect where old URL = new URL (causes redirect loop)',
  'Never run npm run dev directly — always use: doppler run -- npm run dev',
]

function MistakesSection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s6" number="Section 6" title="Common Mistakes — Do Not Do These" />
      <div className="bg-red-950/40 border border-red-800 rounded-lg p-5 space-y-3">
        {MISTAKES.map((m, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-red-400 font-bold flex-shrink-0">❌</span>
            <span className="text-red-200">{m}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section 7: Quick Reference ───────────────────────────────────────────────

function RefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-white font-mono">{value}</span>
    </div>
  )
}

function QuickRefSection() {
  return (
    <div className="mb-12">
      <SectionTitle id="s7" number="Section 7" title="Quick Reference" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Credentials */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Credentials</h4>
          <RefRow label="Ironwood login" value="pestflowpro.com/ironwood" />
          <RefRow label="Demo site" value="pestflow-pro.pestflowpro.com" />
          <RefRow label="Demo admin email" value="admin@pestflowpro.com" />
          <RefRow label="Demo admin password" value="pf123demo" />
          <RefRow label="Supabase project ID" value="biezzykcgzkrwdgqpsar" />
        </div>

        {/* Key URLs */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Key URLs</h4>
          <RefRow label="Book onboarding call" value="outlook.office.com/book/PestFlowProOnboarding@…" />
          <RefRow label="Stripe dashboard" value="dashboard.stripe.com" />
          <RefRow label="Vercel project" value="vercel.com/csdevore2s-projects/pestflow-pro" />
          <RefRow label="Supabase dashboard" value="supabase.com/dashboard/project/biezzykcgzkrwdgqpsar" />
          <RefRow label="GitHub repo" value="github.com/ironwoodoperations/pestflow-pro" />
        </div>

        {/* Templates */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Template Reference</h4>
          <div className="space-y-3">
            {TEMPLATES.map(t => (
              <div key={t.name} className="flex gap-3 items-start">
                <div className={`w-10 h-8 rounded bg-gradient-to-br ${t.color} flex-shrink-0`} />
                <div>
                  <p className="text-xs font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Support</h4>
          <RefRow label="IT issues" value="itsupport@pestflowpro.com" />
          <RefRow label="In-app support" value="Use the Support tab in Ironwood" />
          <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
            <p className="font-semibold text-gray-300 mb-1">Dev server (always use Doppler):</p>
            <code className="text-emerald-300">doppler run -- npm run dev</code>
          </div>
          <div className="mt-3 p-3 bg-gray-800 rounded text-xs text-gray-400">
            <p className="font-semibold text-gray-300 mb-1">Run Claude Code:</p>
            <code className="text-emerald-300">doppler run -- claude --dangerously-skip-permissions</code>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrainingManual() {
  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-gray-950">
      {/* Sticky TOC sidebar */}
      <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto">
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Training Manual</div>
          <p className="text-xs text-gray-500 mt-1">PestFlow Pro — Rep Guide</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {NAV_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="w-full text-left px-3 py-2 rounded text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors leading-snug"
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">

          {/* Welcome */}
          <div id="s0" className="mb-12">
            <div className="bg-gradient-to-r from-emerald-950 to-gray-900 border border-emerald-800 rounded-xl p-8 mb-8">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Section 0</div>
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to PestFlow Pro</h1>
              <p className="text-gray-300 text-base leading-relaxed max-w-2xl">
                This manual is your complete guide to building and launching a PestFlow Pro website
                for any client. Follow it step by step and you cannot go wrong.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-900/60 rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-400">3</div>
                  <div className="text-xs text-gray-400 mt-1">Build paths</div>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-400">11</div>
                  <div className="text-xs text-gray-400 mt-1">Steps per launch</div>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-400">2 hrs</div>
                  <div className="text-xs text-gray-400 mt-1">Fastest launch time</div>
                </div>
              </div>
            </div>
          </div>

          <PricingSection />
          <JourneySection />
          <PathASection />
          <PathBSection />
          <PathCSection />
          <MistakesSection />
          <QuickRefSection />

          <div className="border-t border-gray-800 pt-6 pb-12 text-center text-xs text-gray-600">
            PestFlow Pro Training Manual — Ironwood Operations Group
          </div>
        </div>
      </main>
    </div>
  )
}
