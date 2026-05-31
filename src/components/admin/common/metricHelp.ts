// Central plain-English help copy for every report metric a client sees.
// S250: one place to edit all tooltip text. Voice = a non-technical small-business
// owner, not a marketer. Each entry: one sentence on what it is + one short
// sentence on why it matters / what "good" looks like. Keep help under ~220 chars.
//
// Keys are stable, namespaced strings (e.g. 'gsc.impressions'). Reuse the SAME key
// when a metric appears on more than one surface so the copy stays consistent.

export interface MetricHelp {
  /** Human label shown in the tooltip heading + aria-label. */
  label: string
  /** Plain-English explanation. */
  help: string
}

export const METRIC_HELP: Record<string, MetricHelp> = {
  // ── Google Search Console (GscAnalyticsTile + SEO Overview mini) ──────────
  'gsc.clicks': {
    label: 'Clicks',
    help: 'How many people actually clicked through to your site from Google search. These are real visitors who chose you.',
  },
  'gsc.impressions': {
    label: 'Impressions',
    help: 'How many times your site showed up in Google search results. More impressions means more people are seeing your business.',
  },
  'gsc.ctr': {
    label: 'Click-through rate (CTR)',
    help: 'Of the people who saw you in search, the percent who clicked. A higher number means your title and description are doing their job.',
  },
  'gsc.avg_position': {
    label: 'Average position',
    help: 'Your average ranking spot in Google search results. Lower is better — position 1 is the top of the page.',
  },
  'gsc.position': {
    label: 'Position',
    help: 'Where this search term ranks in Google for you. Lower is better — position 1 is the very top.',
  },
  'gsc.query': {
    label: 'Search query',
    help: 'The actual words people typed into Google before seeing your site. A window into what your customers are looking for.',
  },

  // ── Google Analytics 4 (Ga4AnalyticsTile) ─────────────────────────────────
  'ga4.users': {
    label: 'Total users',
    help: 'The number of individual people who visited your site. Growing this means your reach is expanding.',
  },
  'ga4.sessions': {
    label: 'Sessions',
    help: 'The number of visits to your site. One person can have several sessions if they come back on different days.',
  },
  'ga4.engagement_rate': {
    label: 'Engagement rate',
    help: 'The share of visitors who actually interacted with your site instead of leaving right away. Higher means your content is holding attention.',
  },
  'ga4.page_views': {
    label: 'Page views',
    help: 'The total number of pages viewed across all visits. More views generally means people are exploring more of your site.',
  },
  'ga4.channel': {
    label: 'Channel',
    help: 'Where your visitors came from — Google search, social media, a direct link, etc. Shows which of your efforts bring people in.',
  },
  'ga4.views': {
    label: 'Views',
    help: 'How many times this page was viewed. Your most-viewed pages are the ones working hardest for you.',
  },

  // ── PageSpeed / Site Performance (SitePerformanceTile + Overview mini) ─────
  'pagespeed.performance': {
    label: 'Performance',
    help: 'How fast your site loads, scored out of 100. Higher is better — a fast site keeps visitors from leaving and helps your Google ranking.',
  },
  'pagespeed.accessibility': {
    label: 'Accessibility',
    help: 'How easily everyone — including people using assistive tools — can use your site, scored out of 100. Higher is better.',
  },
  'pagespeed.best_practices': {
    label: 'Best Practices',
    help: 'How well your site follows modern web standards for security and quality, scored out of 100. Higher is better.',
  },
  'pagespeed.seo': {
    label: 'SEO score',
    help: 'How well your site is set up for search engines to find and understand, scored out of 100. Higher is better.',
  },
  'pagespeed.desktop_mobile': {
    label: 'Desktop vs Mobile',
    help: 'Your load-speed score on a computer versus a phone. Mobile usually scores lower, and most customers visit on their phones.',
  },

  // ── SEO Analytics (SeoAnalyticsTile) ──────────────────────────────────────
  'seo.keywords': {
    label: 'Keywords',
    help: 'The search terms your site is being tracked for. These are the phrases you want customers to find you with.',
  },
  'seo.competitors': {
    label: 'Competitors',
    help: 'Other businesses competing for the same search terms as you. Knowing them helps you see where you can win.',
  },
  'seo.opportunities': {
    label: 'Opportunities',
    help: 'Keywords a competitor ranks for that you don’t yet. Think of these as your easiest wins to go after.',
  },
  'seo.volume': {
    label: 'Search volume',
    help: 'Roughly how many times people search this term each month. Higher volume means more potential customers.',
  },
  'seo.url': {
    label: 'URL',
    help: 'The page on your site that ranks for this keyword.',
  },
  'seo.avg_position': {
    label: 'Average position',
    help: 'A competitor’s average ranking across shared keywords. Lower is better — it shows how strong they are in search.',
  },
  'seo.shared_keywords': {
    label: 'Shared keywords',
    help: 'How many search terms you and this competitor both rank for. More overlap means you’re competing head-to-head.',
  },
  'seo.visibility': {
    label: 'Visibility',
    help: 'A score for how often a competitor shows up in search results overall. Higher means they dominate more of the page.',
  },
  'seo.competitor_position': {
    label: 'Their position',
    help: 'Where the competitor ranks for this keyword. If they’re high and you’re absent, it’s an opening for you.',
  },

  // ── SEO Overview stat cards (SeoStatCards) ────────────────────────────────
  'seo.total_pages': {
    label: 'Total pages',
    help: 'Every page on your website. More quality pages give Google more chances to send you customers.',
  },
  'seo.live_pages': {
    label: 'Live pages',
    help: 'Pages that are published and visible to the public right now.',
  },
  'seo.seo_configured': {
    label: 'SEO configured',
    help: 'How many of your pages have their search settings (title, description) filled in. Fully configured pages rank better.',
  },
  'seo.issues_found': {
    label: 'Issues found',
    help: 'Live pages missing their search settings. Each one is a quick fix that can help you show up in Google.',
  },

  // ── Content coverage cards (SeoOverviewTab) ───────────────────────────────
  'coverage.pest_pages': {
    label: 'Pest pages',
    help: 'Service pages for each pest you treat. The more you publish, the more searches you can show up for.',
  },
  'coverage.service_area_pages': {
    label: 'Service area pages',
    help: 'Pages targeting each town or area you serve. They help you appear in local searches near your customers.',
  },
  'coverage.blog_pages': {
    label: 'Blog posts',
    help: 'Articles on your site. Fresh, helpful posts bring in visitors and signal to Google that your site is active.',
  },
  'coverage.static_pages': {
    label: 'Static pages',
    help: 'Core pages like Home, About, and Contact. The foundation every visitor expects to find.',
  },

  // ── SEO Coverage tile (SeoCoverageTile) ───────────────────────────────────
  'seo.meta_title': {
    label: 'Meta title',
    help: 'The headline that shows in Google search results for a page. A clear, keyword-rich title earns more clicks.',
  },
  'seo.meta_description': {
    label: 'Meta description',
    help: 'The short summary under your title in Google results. A good one convinces searchers to click you over a competitor.',
  },
  'seo.focus_keyword': {
    label: 'Focus keyword',
    help: 'The main search term a page is built around. Setting one keeps the page focused on what you want to rank for.',
  },

  // ── Social Analytics tile (SocialAnalyticsTile) ───────────────────────────
  'social.platforms': {
    label: 'Platforms',
    help: 'How many social networks you have connected. More connected platforms means more places customers can find you.',
  },
  'social.total_followers': {
    label: 'Total followers',
    help: 'The combined number of people following you across all your connected social accounts.',
  },
  'social.followers': {
    label: 'Followers',
    help: 'People who follow this account so they see your posts. A growing audience for your business.',
  },
  'social.engagement': {
    label: 'Engagement',
    help: 'Likes, comments, and shares your posts receive. Higher engagement means your content is connecting with people.',
  },
  'social.reach': {
    label: 'Reach',
    help: 'How many people actually saw your posts. The bigger the reach, the more potential customers you’re in front of.',
  },

  // ── Social Analytics tab (SocialAnalyticsTab) ─────────────────────────────
  'social.total_posts_published': {
    label: 'Total posts published',
    help: 'Everything you’ve posted to social so far. Staying consistent keeps your business top of mind.',
  },
  'social.posts_this_month': {
    label: 'Posts this month',
    help: 'How many posts you’ve published this calendar month. A steady cadence works better than occasional bursts.',
  },
  'social.platforms_active': {
    label: 'Platforms active',
    help: 'How many social networks you’ve actually published to. Being active on more channels widens your audience.',
  },
  'social.best_posts': {
    label: 'Best performing posts',
    help: 'Your posts that earned the most reach and engagement. Do more of what’s working here.',
  },

  // ── Social Posts tile (SocialPostsTile) — status counts ───────────────────
  'social.total': {
    label: 'Total posts',
    help: 'Every social post in your account, across all statuses.',
  },
  'social.published': {
    label: 'Published',
    help: 'Posts that have already gone live on your social accounts.',
  },
  'social.scheduled': {
    label: 'Scheduled',
    help: 'Posts queued to publish automatically at a future date and time.',
  },
  'social.drafts': {
    label: 'Drafts',
    help: 'Posts you’ve started or approved but haven’t scheduled or published yet.',
  },

  // ── Reports stat cards (ReportsStatCards) — leads/CRM ─────────────────────
  'leads.total': {
    label: 'Total leads',
    help: 'Everyone who has reached out through your site in this time period. Your pipeline of potential customers.',
  },
  'leads.new': {
    label: 'New (uncontacted)',
    help: 'Leads you haven’t followed up with yet. Reaching out quickly is the single biggest driver of winning the job.',
  },
  'leads.converted': {
    label: 'Converted',
    help: 'Leads that turned into customers. This is the number that pays the bills.',
  },
  'leads.conversion_rate': {
    label: 'Conversion rate',
    help: 'The percent of leads that became customers. Higher means your follow-up and pricing are landing.',
  },

  // ── Blog tile (BlogAnalyticsTile) ─────────────────────────────────────────
  'blog.published': {
    label: 'Published',
    help: 'How many blog posts are live on your site. More helpful articles bring in more search traffic over time.',
  },
  'blog.last_30_days': {
    label: 'Last 30 days',
    help: 'Posts you’ve published in the past month. Regular posting keeps your site fresh in Google’s eyes.',
  },
  'blog.most_recent': {
    label: 'Most recent',
    help: 'Your latest published post. A recent date shows your site is active and maintained.',
  },
}
