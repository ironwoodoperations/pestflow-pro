import { useState, useEffect, useRef, useCallback } from 'react'
import { lazy, Suspense } from 'react'
import Navbar from '../ShellNavbar'
import Footer from '../ShellFooter'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import DangFaqAccordion, { type FaqEntry } from './DangFaqAccordion'

const DangFaqAiChat = lazy(() => import('./DangFaqAiChat'))

const CATEGORY_ORDER = [
  'General', 'Ants', 'Spiders', 'Wasps & Yellow Jackets',
  'Scorpions', 'Rodents', 'Mosquitoes', 'Fleas & Ticks', 'Roaches', 'Bed Bugs',
]

const SLUG_MAP: Record<string, string> = {
  'General': 'general', 'Ants': 'ants', 'Spiders': 'spiders',
  'Wasps & Yellow Jackets': 'wasps---yellow-jackets', 'Scorpions': 'scorpions',
  'Rodents': 'rodents', 'Mosquitoes': 'mosquitoes', 'Fleas & Ticks': 'fleas---ticks',
  'Roaches': 'roaches', 'Bed Bugs': 'bed-bugs',
}

export default function FAQPage() {
  const { tenantId, loading: tenantLoading } = useTenant()
  const [faqs, setFaqs] = useState<FaqEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, IntersectionObserverEntry>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('faqs')
      .select('id, question, answer, category, sort_order')
      .eq('tenant_id', tenantId)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .then(({ data }) => { setFaqs(data || []); setLoading(false) })
  }, [tenantId])

  // IntersectionObserver for active category pill
  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect()
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { sectionRefs.current[e.target.id] = e })
        // Find topmost visible section
        const visible = Object.values(sectionRefs.current)
          .filter(e => e.isIntersecting)
          .sort((a, b) => (a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top))
        if (visible.length > 0) setActiveCategory(visible[0].target.getAttribute('data-category') || '')
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    document.querySelectorAll('[data-category]').forEach(el => observer.observe(el))
    observerRef.current = observer
  }, [])

  useEffect(() => {
    if (!loading && !search) setupObserver()
    return () => observerRef.current?.disconnect()
  }, [loading, search, setupObserver])

  const availableCategories = CATEGORY_ORDER.filter(c => faqs.some(f => f.category === c))

  const filteredFaqs = search.trim()
    ? faqs.filter(f =>
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqs

  const scrollToCategory = (cat: string) => {
    const slug = SLUG_MAP[cat] || cat.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const el = document.getElementById(slug)
    if (!el) return
    const offset = (navRef.current?.offsetHeight || 56) + 70
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' })
    setActiveCategory(cat)
  }

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", color: 'hsl(20, 40%, 12%)', overflowX: 'hidden' }}>
      <Navbar />
      <main>

        {/* HERO */}
        <section style={{
          position: 'relative',
          background: `url(/dang/moblie_banner.webp) center/cover no-repeat, hsl(28, 100%, 50%)`,
          paddingTop: '80px', paddingBottom: '200px', minHeight: '420px', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px 30px' }}>
            <h1 style={{
              fontFamily: '"Bangers", cursive',
              fontSize: 'clamp(42px, 7vw, 88px)',
              color: 'hsl(45, 95%, 60%)',
              fontStyle: 'italic', letterSpacing: '0.05em',
              WebkitTextStroke: '3px #000000', textShadow: '3px 3px 0 #000000',
              margin: 0, lineHeight: 1.05,
            }}>
              FREQUENTLY ASKED<br />QUESTIONS
            </h1>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
            <img fetchPriority="high" width={1200} height={50} src="/dang/banner-img.png" alt="" style={{ width: '100%', display: 'block' }} />
          </div>
        </section>

        {/* SEARCH + CATEGORY NAV (sticky) */}
        <div ref={navRef} style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: '#fff', borderBottom: '1px solid #f0ece8',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        }}>
          {/* Search */}
          <div style={{ padding: '14px 20px 10px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#aaa' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search questions... e.g. "ants", "treatment", "warranty"'
                style={{
                  width: '100%', padding: '10px 38px 10px 36px', border: '1.5px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  fontFamily: "'Open Sans', sans-serif",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#aaa', lineHeight: 1,
                  }}
                  aria-label="Clear search"
                >×</button>
              )}
            </div>
            {search && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#888' }}>
                Showing {filteredFaqs.length} of {faqs.length} questions
              </p>
            )}
          </div>

          {/* Category pills */}
          {!search && (
            <div style={{
              overflowX: 'auto', display: 'flex', gap: '8px',
              padding: '0 20px 12px', scrollbarWidth: 'none',
              maxWidth: '1000px', margin: '0 auto',
            }}>
              {availableCategories.map(cat => {
                const active = activeCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    style={{
                      flexShrink: 0,
                      padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                      background: active ? '#F97316' : '#fff',
                      color: active ? '#fff' : '#F97316',
                      border: `2px solid ${active ? '#F97316' : '#F97316'}`,
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* FAQ CONTENT */}
        <section style={{ padding: '48px 24px 100px', maxWidth: '1000px', margin: '0 auto' }}>
          {loading || tenantLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: '15px' }}>Loading questions...</div>
          ) : search && filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔎</div>
              <p style={{ color: '#888', fontSize: '15px' }}>No questions match "{search}". Try a different term.</p>
            </div>
          ) : (
            <div>
              {/* Wrap each category section with data-category attr for observer */}
              {!search ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  {availableCategories.map(cat => {
                    const slug = SLUG_MAP[cat] || cat.toLowerCase().replace(/[^a-z0-9]/g, '-')
                    const catFaqs = faqs.filter(f => f.category === cat)
                    return (
                      <section key={cat} id={slug} data-category={cat}>
                        <h2 style={{
                          fontFamily: '"Bangers", cursive',
                          fontSize: 'clamp(22px, 3vw, 30px)',
                          color: '#F97316', letterSpacing: '0.04em',
                          margin: '0 0 4px',
                          borderBottom: '2px solid #F97316', paddingBottom: '6px',
                        }}>
                          {cat}
                        </h2>
                        <DangFaqAccordion faqs={catFaqs} />
                      </section>
                    )
                  })}
                </div>
              ) : (
                <DangFaqAccordion faqs={filteredFaqs} />
              )}
            </div>
          )}
        </section>

      </main>
      <Footer />

      {/* AI Chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 997,
            background: '#F97316', color: '#fff',
            padding: '13px 20px', borderRadius: '50px', border: 'none',
            fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.45)',
            display: 'flex', alignItems: 'center', gap: '7px',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🤖 Ask Dang AI
        </button>
      )}

      {chatOpen && (
        <Suspense fallback={null}>
          <DangFaqAiChat onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
