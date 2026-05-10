// Tiny extended-markdown renderer for platform legal pages. NOT a general-purpose
// markdown library. Handles only the subset used by terms.ts / privacy.ts:
//   # H1   ## H2
//   - bullet  (consecutive lines collapse into a <ul>)
//   blank-line-separated paragraphs
//   inline **bold** and _italic_ via simple regex
// Anything fancier (links, code, tables, nested lists) is intentionally out of scope.

import { Fragment, type ReactNode } from 'react';

const F = { b: "'Plus Jakarta Sans', sans-serif" };

function renderInline(text: string): ReactNode[] {
  // Split on **bold** and _italic_ in one pass; preserve everything else.
  const tokens = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith('_') && tok.endsWith('_') && tok.length > 2) {
      return <em key={i} style={{ color: 'rgba(255,255,255,0.6)' }}>{tok.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{tok}</Fragment>;
  });
}

export function renderLegalMarkdown(content: string): ReactNode[] {
  const lines = content.split('\n');
  const out: ReactNode[] = [];
  let buf: string[] = [];
  let bullets: string[] = [];

  const flushPara = () => {
    if (buf.length === 0) return;
    const text = buf.join(' ').trim();
    buf = [];
    if (!text) return;
    out.push(
      <p key={`p-${out.length}`} style={{ fontFamily: F.b, fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px' }}>
        {renderInline(text)}
      </p>,
    );
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} style={{ fontFamily: F.b, fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', paddingLeft: 22 }}>
        {bullets.map((b, i) => <li key={i} style={{ marginBottom: 6 }}>{renderInline(b)}</li>)}
      </ul>,
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) {
      flushBullets(); flushPara();
      out.push(<h1 key={`h1-${out.length}`} style={{ fontFamily: F.b, fontSize: 32, fontWeight: 800, color: '#ffffff', margin: '0 0 18px', lineHeight: 1.2 }}>{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      flushBullets(); flushPara();
      out.push(<h2 key={`h2-${out.length}`} style={{ fontFamily: F.b, fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '32px 0 14px', lineHeight: 1.25 }}>{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('- ')) {
      flushPara();
      bullets.push(line.slice(2));
    } else if (line.trim() === '') {
      flushBullets(); flushPara();
    } else {
      flushBullets();
      buf.push(line);
    }
  }
  flushBullets(); flushPara();
  return out;
}
