'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

export interface FaqCategory {
  name: string;
  slug: string;
  items: { question: string; answer: string }[];
}

// The search field only earns its space on large sets; small sets are fully
// visible under the chips already. No per-tenant config — count decides.
const SEARCH_MIN_QUESTIONS = 20;

interface Props {
  categories: FaqCategory[];
  isBoldLocal: boolean;
}

// CONSTRAINT: every answer must be present in the server-rendered HTML — the
// JSON-LD asserts this content, so the page must actually contain it.
// Collapse uses the `hidden` attribute and search uses display:none; nothing
// is conditionally mounted.
export function FaqBrowser({ categories, isBoldLocal }: Props) {
  const total = categories.reduce((n, c) => n + c.items.length, 0);
  const showSearch = total >= SEARCH_MIN_QUESTIONS;

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(categories[0]?.slug ?? '');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const q = query.trim().toLowerCase();
  const itemMatches = useMemo(
    () => categories.map(c => c.items.map(it =>
      q === '' || it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q)
    )),
    [categories, q],
  );
  const anyMatch = itemMatches.some(m => m.some(Boolean));

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && (entry.target as HTMLElement).id) {
          setActive((entry.target as HTMLElement).id);
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    for (const el of Object.values(sectionRefs.current)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories]);

  const jumpTo = (slug: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActive(slug);
    const el = sectionRefs.current[slug];
    if (el) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <div className="max-w-4xl mx-auto px-4">

        <div
          className="sticky top-0 z-20 py-4"
          style={{ backgroundColor: 'var(--color-bg-section)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        >
          {showSearch && (
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search questions... e.g. "sprinkler", "warranty", "drainage"'
              aria-label="Search questions"
              className="w-full mb-3 rounded-lg border border-gray-300 px-4 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
            />
          )}
          <nav aria-label="FAQ categories" className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const isActive = active === cat.slug;
              return (
                <a
                  key={cat.slug}
                  href={`#${cat.slug}`}
                  onClick={jumpTo(cat.slug)}
                  aria-current={isActive ? 'true' : undefined}
                  className="text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
                  style={{
                    padding: '.4rem 1rem',
                    borderRadius: 999,
                    border: '1px solid var(--color-accent)',
                    backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--color-accent)',
                  }}
                >
                  {cat.name}
                </a>
              );
            })}
          </nav>
        </div>

        {showSearch && q !== '' && !anyMatch && (
          <p className="mt-10 text-center text-gray-500">No questions match that search.</p>
        )}

        {categories.map((cat, ci) => {
          const catHasMatch = itemMatches[ci].some(Boolean);
          return (
            <section
              key={cat.slug}
              id={cat.slug}
              ref={el => { sectionRefs.current[cat.slug] = el; }}
              className="mt-12"
              style={{ scrollMarginTop: '5.5rem', display: catHasMatch ? undefined : 'none' }}
            >
              <h2
                className="text-xl font-bold uppercase tracking-wide pb-2 mb-6"
                style={{ color: 'var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }}
              >
                {cat.name}
              </h2>
              <div>
                {cat.items.map((item, i) => {
                  const key = `${cat.slug}-${i}`;
                  const answerId = `faq-answer-${key}`;
                  const buttonId = `faq-button-${key}`;
                  const isOpen = open[key] === true;
                  return (
                    <div
                      key={key}
                      className="border-b border-gray-200"
                      style={{ display: itemMatches[ci][i] ? undefined : 'none' }}
                    >
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        onClick={() => setOpen(prev => ({ ...prev, [key]: !isOpen }))}
                        className="w-full flex items-center justify-between gap-4 py-4 text-left text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent)]"
                        style={{ color: 'var(--color-heading, #1a1a1a)' }}
                      >
                        <span>{item.question}</span>
                        <span aria-hidden="true" className="text-2xl leading-none shrink-0" style={{ color: 'var(--color-accent)' }}>
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      <div
                        id={answerId}
                        role="region"
                        aria-labelledby={buttonId}
                        hidden={!isOpen}
                        className="pb-4"
                      >
                        <p className={isBoldLocal ? undefined : 'text-gray-600'} style={isBoldLocal ? { color: 'var(--color-body-text)' } : undefined}>
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

      </div>
    </section>
  );
}
