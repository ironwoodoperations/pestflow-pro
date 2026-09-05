// S346C Part C — a firecrawl_migration prospect must be able to reach the slug
// and admin-email inputs. It could not: the section that owns them was hidden
// for exactly that build path, and `slug` has no other editor and no fallback.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '..');
const codeOnly = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const SECTIONS = codeOnly(readFileSync(join(dir, 'ProspectDetail.Sections.tsx'), 'utf8'));
const SETUP = codeOnly(readFileSync(join(dir, 'ProspectDetail.SiteSetup.tsx'), 'utf8'));
const PROVISION = codeOnly(readFileSync(join(dir, 'ProspectDetail.Provisioning.tsx'), 'utf8'));

describe('SiteSetupSection is reachable on every build path', () => {
  it('it is NOT gated on build_path any more', () => {
    const at = SECTIONS.indexOf('<SiteSetupSection');
    expect(at).toBeGreaterThan(-1);
    // the 200 chars before the element must carry no build_path condition
    const before = SECTIONS.slice(Math.max(0, at - 200), at);
    expect(before).not.toMatch(/build_path/);
  });

  it('MUTATION: reinstating the firecrawl_migration exclusion is caught', () => {
    const broken = SECTIONS.replace(
      '<div className="mb-4"><SiteSetupSection',
      "{form.build_path !== 'firecrawl_migration' && (\n<div className=\"mb-4\"><SiteSetupSection",
    );
    const at = broken.indexOf('<SiteSetupSection');
    expect(broken.slice(Math.max(0, at - 200), at)).toMatch(/build_path/);
  });

  it('ANTI-VACUITY: the stripper left the real element behind', () => {
    expect(SECTIONS).toMatch(/<SiteSetupSection\s+form=\{form\}/);
    expect(SECTIONS).toMatch(/<ProvisionSection/);
  });
});

describe('the three fields provisioning validates are editable', () => {
  it('SiteSetupSection owns slug, admin_email and admin_password', () => {
    for (const field of ['slug', 'admin_email', 'admin_password']) {
      expect(SETUP, field).toMatch(new RegExp(`setField\\('${field}'`));
    }
  });

  it('slug is REQUIRED by canCreate and has no fallback — hence it must be editable', () => {
    expect(PROVISION).toMatch(/canCreate\s*=\s*!!form\.slug/);
    // admin email does have fallbacks; slug deliberately does not
    expect(PROVISION).toMatch(/resolvedAdminEmail\s*=/);
  });

  it('there is exactly ONE editor for slug — no duplicated second one', () => {
    const editors = [SETUP, PROVISION].filter(src => /setField\('slug'/.test(src));
    expect(editors).toHaveLength(1);
  });
});
