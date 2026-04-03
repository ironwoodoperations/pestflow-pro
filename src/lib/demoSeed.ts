import type { SupabaseClient } from '@supabase/supabase-js'

export async function seedDemoData(tenantId: string, supabase: SupabaseClient): Promise<void> {
  await Promise.all([
    supabase.from('leads').insert([
      {
        tenant_id: tenantId,
        name: 'Demo: Robert Faulkner',
        email: 'rfaulkner@example.com',
        phone: '(903) 555-0101',
        services: ['General Pest Control'],
        status: 'new',
        notes: 'Seeing roaches in the kitchen and bathroom.',
      },
      {
        tenant_id: tenantId,
        name: 'Demo: Sandra Okafor',
        email: 'sokafor@example.com',
        phone: '(903) 555-0102',
        services: ['Termite Inspection'],
        status: 'contacted',
        notes: 'Buying a home, needs inspection before closing.',
      },
      {
        tenant_id: tenantId,
        name: 'Demo: James Whitfield',
        email: 'jwhitfield@example.com',
        phone: '(903) 555-0103',
        services: ['Mosquito Control'],
        status: 'quoted',
        notes: 'Large backyard, wants monthly mosquito treatment.',
      },
      {
        tenant_id: tenantId,
        name: 'Demo: Angela Tran',
        email: 'atran@example.com',
        phone: '(903) 555-0104',
        services: ['Rodent Control'],
        status: 'won',
        notes: 'Signed up for quarterly rodent exclusion plan.',
      },
      {
        tenant_id: tenantId,
        name: 'Demo: Marcus Delgado',
        email: 'mdelgado@example.com',
        phone: '(903) 555-0105',
        services: ['Ant Control'],
        status: 'lost',
        notes: 'Went with a competitor for pricing reasons.',
      },
      {
        tenant_id: tenantId,
        name: 'Demo: Patricia Simmons',
        email: 'psimmons@example.com',
        phone: '(903) 555-0106',
        services: ['Bed Bug Treatment'],
        status: 'new',
        notes: 'Found bed bugs in guest bedroom.',
      },
    ]),

    supabase.from('blog_posts').insert([
      {
        tenant_id: tenantId,
        title: 'Demo: 5 Signs You Have a Termite Problem',
        slug: 'demo-5-signs-termite-problem',
        content: 'Termites cause billions in property damage each year. Here are five warning signs every East Texas homeowner should know: mud tubes along your foundation, hollow-sounding wood, discarded wings near windows, tight-fitting doors or windows, and visible damage in crawl spaces. Early detection is key — contact a licensed inspector at the first sign.',
        published: true,
        meta_description: 'Learn the top 5 signs of termite infestation and what to do about them.',
      },
      {
        tenant_id: tenantId,
        title: 'Demo: How to Mosquito-Proof Your Backyard This Summer',
        slug: 'demo-mosquito-proof-backyard-summer',
        content: 'Standing water is the #1 breeding ground for mosquitoes. Eliminate it by emptying bird baths weekly, clearing clogged gutters, and flipping over unused containers. Add citronella plants around your patio, use outdoor fans to disrupt flight patterns, and consider a professional barrier spray for lasting protection throughout the season.',
        published: true,
        meta_description: 'Practical tips to reduce mosquitoes in your backyard this summer.',
      },
      {
        tenant_id: tenantId,
        title: 'Demo: What to Expect During a Professional Pest Inspection',
        slug: 'demo-what-to-expect-pest-inspection',
        content: 'A thorough pest inspection covers your attic, crawl space, foundation perimeter, kitchen, bathrooms, and any areas with moisture. The technician looks for entry points, conducive conditions, and active infestations. You will receive a written report and a customized treatment recommendation. Most inspections take 45–60 minutes.',
        published: false,
        meta_description: 'A step-by-step guide to what happens during a professional pest inspection.',
      },
    ]),

    supabase.from('social_posts').insert([
      {
        tenant_id: tenantId,
        caption: '[Demo] Spotted mud tubes near your foundation? That is a classic sign of termites. Call us today for a free inspection! #TermiteControl #EastTexas',
        status: 'published',
        platform: 'facebook',
      },
      {
        tenant_id: tenantId,
        caption: '[Demo] Summer is mosquito season in East Texas. Our barrier spray keeps your yard bite-free for up to 21 days. Book now! #MosquitoControl #Tyler TX',
        status: 'scheduled',
        platform: 'facebook',
      },
      {
        tenant_id: tenantId,
        caption: '[Demo] Did you know a single mouse can squeeze through a gap the size of a dime? We seal entry points and eliminate the problem at the source. #RodentControl',
        status: 'draft',
        platform: 'facebook',
      },
      {
        tenant_id: tenantId,
        caption: '[Demo] Happy customers are the foundation of our business. Thank you for trusting Ironclad Pest Solutions with your home! ⭐⭐⭐⭐⭐ #Testimonial',
        status: 'draft',
        platform: 'facebook',
      },
    ]),

    supabase.from('testimonials').insert([
      {
        tenant_id: tenantId,
        author_name: 'Demo: Kevin Barnett',
        rating: 5,
        review_text: 'Ironclad took care of a serious roach problem we had been battling for months. Professional, thorough, and completely effective. Could not be happier.',
        approved: true,
      },
      {
        tenant_id: tenantId,
        author_name: 'Demo: Loretta Chambers',
        rating: 5,
        review_text: 'The termite inspection was fast and detailed. The technician walked me through every finding and gave me a clear plan. Highly recommend!',
        approved: true,
      },
      {
        tenant_id: tenantId,
        author_name: 'Demo: Greg Navarro',
        rating: 4,
        review_text: 'Great service, fair pricing. The mosquito barrier spray made our backyard usable again all summer long.',
        approved: true,
      },
      {
        tenant_id: tenantId,
        author_name: 'Demo: Shawna Ellison',
        rating: 5,
        review_text: 'Marcus and his team are true professionals. They arrived on time, explained everything, and our ant problem was gone within a week.',
        approved: true,
      },
    ]),
  ])

  await supabase.from('settings').upsert(
    { tenant_id: tenantId, key: 'demo_mode', value: { active: true, seeded_at: new Date().toISOString() } },
    { onConflict: 'tenant_id,key' }
  )
}

export async function resetDemoData(tenantId: string, supabase: SupabaseClient): Promise<void> {
  await Promise.all([
    supabase.from('leads').delete().eq('tenant_id', tenantId).like('name', 'Demo:%'),
    supabase.from('blog_posts').delete().eq('tenant_id', tenantId).like('title', 'Demo:%'),
    supabase.from('social_posts').delete().eq('tenant_id', tenantId).like('caption', '[Demo]%'),
    supabase.from('testimonials').delete().eq('tenant_id', tenantId).like('author_name', 'Demo:%'),
  ])

  await supabase.from('settings').upsert(
    { tenant_id: tenantId, key: 'demo_mode', value: { active: false, seeded_at: null } },
    { onConflict: 'tenant_id,key' }
  )
}
