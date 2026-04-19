import Link from 'next/link';
import { Home, Shield, Heart, Leaf, Users, CheckCircle2, Bug, Wind, Droplets, Zap, Star, Eye } from 'lucide-react';
import { PEST_CONTENT_MAP } from '../../../../../src/shells/_shared/pestContent';

const ICON_ROTATION = [Home, Shield, Heart, Leaf, Users, CheckCircle2, Bug, Wind, Droplets, Zap, Star, Eye];
const COLOR_ROTATION = ['var(--cf-sky)', 'var(--cf-mint)', 'var(--cf-ochre)'];

const OUTCOME_BLURBS: Record<string, string> = {
  'pest-control':        'Comprehensive home protection — safe for pets and kids, guaranteed results.',
  'termite-control':     'Stop termites before they cost you thousands. Discreet, effective treatment.',
  'termite-inspections': 'Peace of mind starts with knowing. Thorough inspection by licensed pros.',
  'mosquito-control':    'Take back your yard. Effective mosquito reduction so the family can be outside.',
  'roach-control':       'Roaches are gone and staying gone. Treatment safe for the whole household.',
  'ant-control':         'Ant-free kitchen, ant-free yard. Long-lasting barrier that keeps them out.',
  'spider-control':      'Safe, effective spider removal — especially important for venomous species.',
  'scorpion-control':    'Protect barefoot families. Scorpion exclusion and targeted treatment.',
  'rodent-control':      'No traps for kids to find. Discreet rodent control with entry-point sealing.',
  'flea-tick-control':   'Protect your pets and your kids. Flea and tick treatment for yard and home.',
  'bed-bug-control':     'Sleep soundly again. Thorough bed bug elimination with follow-up guarantee.',
  'wasp-hornet-control': 'Safe nest removal, same day when possible. You stay inside; we handle it.',
};

const PESTS = Object.values(PEST_CONTENT_MAP);

export function CleanFriendlyServicesGrid() {
  return (
    <section style={{ backgroundColor: 'var(--cf-bg-mint)', borderBottom: '1px solid var(--cf-divider)', padding: '4rem 1rem' }}>
      <div className="max-w-6xl mx-auto">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: "Georgia,'Source Serif Pro',serif", fontStyle: 'italic', fontSize: 14, color: 'var(--cf-ink-secondary)', marginBottom: '0.5rem' }}>
            our work
          </p>
          <h2 style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 'clamp(24px,3.5vw,36px)', color: 'var(--cf-ink)', lineHeight: 1.2 }}>
            Thoughtful pest control for the whole family
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
          {PESTS.map((pest, i) => {
            const Icon = ICON_ROTATION[i % ICON_ROTATION.length];
            const iconColor = COLOR_ROTATION[i % COLOR_ROTATION.length];
            const blurb = OUTCOME_BLURBS[pest.slug] || `Licensed ${pest.displayName.toLowerCase()} control — safe for pets and kids, guaranteed results.`;
            return (
              <Link key={pest.slug} href={`/${pest.slug}`} style={{ display: 'block', backgroundColor: 'var(--cf-surface-card)', border: '1px solid var(--cf-divider)', borderRadius: 16, padding: '1.5rem', textDecoration: 'none', boxShadow: '0 2px 12px rgba(31,58,77,0.06)' }} className="cf-service-card">
                <span style={{ color: iconColor, display: 'block', marginBottom: '0.75rem' }}>
                  <Icon size={28} aria-hidden="true" />
                </span>
                <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 500, fontSize: 17, color: 'var(--cf-ink)', display: 'block', marginBottom: '0.35rem', lineHeight: 1.25 }}>
                  {pest.displayName}
                </span>
                <span style={{ fontFamily: "var(--font-inter,'Inter',sans-serif)", fontWeight: 400, fontSize: 13, color: 'var(--cf-ink-secondary)', lineHeight: 1.55, display: 'block' }}>
                  {blurb}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`.cf-service-card:hover{border-color:var(--cf-sky);box-shadow:0 4px 18px rgba(31,58,77,0.1)}`}</style>
    </section>
  );
}
