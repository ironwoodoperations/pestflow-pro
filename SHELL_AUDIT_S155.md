# S155 Shell Nav Href Audit

Audited: 2026-04-19  
Method: `grep -rn "/tenant/"` across all non-dang shell files + full href enumeration of ShellNavbar, ShellFooter, ShellHero, and CTA banner components.

---

## Summary

| Shell | Has /tenant/ prefix bug? | Dead-route links (unverified routes) |
|---|---|---|
| metro-pro | NO | /blog |
| modern-pro | NO | /blog, /reviews, /service-area |
| clean-friendly | NO | /blog, /reviews, /service-area |
| bold-local | NO | /blog, /service-area |
| rustic-rugged | NO | /service-area |

**Result: Zero occurrences of `/tenant/` prefix in any user-facing href across all 5 shells. No fix required.**

---

## Per-shell detail

### metro-pro
Files checked:
- `src/shells/metro-pro/ShellNavbar.tsx`
- `src/shells/metro-pro/ShellFooter.tsx`
- `src/shells/metro-pro/ShellHero.tsx`
- `src/shells/metro-pro/MetroProCtaBanner.tsx`

All hrefs are bare absolute paths or protocol/external. Uses `<Link to="...">` (react-router-dom) throughout.

Href inventory:
- `<Link to="/">` — home
- `<Link to={link.href}>` — service pages: `/pest-control`, `/termite-control`, `/rodent-control`, `/mosquito-control`, `/bed-bug-control`, `/spider-control`, `/ant-control`, `/wasp-hornet-control`
- `<Link to={link.href}>` — nav: `/about`, `/blog`, `/contact`
- `<Link to="/quote">` — CTA
- `href={tel:...}` — phone (protocol)
- `href="https://pestflowpro.com"` — powered-by (external)
- `href="#main-content"` — skip link (anchor)

Dead-route links (NOT fixed — separate investigation):
- `/blog` — navbar line 25, footer line 20

---

### modern-pro
Files checked:
- `src/shells/modern-pro/ShellNavbar.tsx`
- `src/shells/modern-pro/ShellFooter.tsx`
- `src/shells/modern-pro/ShellHero.tsx`
- `src/shells/modern-pro/ModernProCtaBanner.tsx`

All hrefs are bare absolute paths or protocol/external. Uses `<Link to="...">` throughout.

Href inventory:
- `<Link to="/">` — home
- `<Link to={link.href}>` — service pages (same slug list as metro-pro + termite-inspections, scorpion-control, flea-tick-control)
- `<Link to={link.href}>` — nav: `/about`, `/blog`, `/reviews`, `/contact`, `/service-area` (labelled "Locations")
- `<Link to="/quote">` — CTA
- Footer QUICK_LINKS: `/`, `/pest-control`, `/about`, `/blog`, `/reviews`, `/contact`, `/quote`, `/service-area`
- `href={tel:...}` — phone (protocol)
- `href={mailto:...}` — email (protocol)
- `href="https://pestflowpro.com"` — powered-by (external)

Dead-route links (NOT fixed — separate investigation):
- `/blog` — navbar line 24, footer line 18
- `/reviews` — navbar line 26, footer line 19
- `/service-area` — navbar line 23 (labelled "Locations"), footer line 20

---

### clean-friendly
Files checked:
- `src/shells/clean-friendly/ShellNavbar.tsx`
- `src/shells/clean-friendly/ShellFooter.tsx`
- `src/shells/clean-friendly/ShellHero.tsx`
- `src/shells/clean-friendly/CleanFriendlyCtaBanner.tsx`

All hrefs are bare absolute paths or protocol/external. Uses `<Link to="...">` throughout.

Href inventory:
- `<Link to="/">` — home
- `<Link to={link.href}>` — service pages (same as modern-pro)
- `<Link to={link.href}>` — nav: `/about`, `/blog`, `/reviews`, `/contact`, `/service-area` (labelled "Locations")
- `<Link to="/quote">` — CTA button (uses ctaText label)
- Footer QUICK_LINKS: `/`, `/pest-control`, `/about`, `/blog`, `/reviews`, `/contact`, `/quote`, `/service-area`
- `href={tel:...}` — phone (protocol)
- `href={mailto:...}` — email (protocol)
- `href="https://pestflowpro.com"` — powered-by (external)

Dead-route links (NOT fixed — separate investigation):
- `/blog` — navbar line 24, footer line 18
- `/reviews` — navbar line 25, footer line 19
- `/service-area` — navbar line 23 (labelled "Locations"), footer line 20

---

### bold-local
Files checked:
- `src/shells/bold-local/ShellNavbar.tsx`
- `src/shells/bold-local/ShellFooter.tsx`
- `src/shells/bold-local/ShellHero.tsx`
- `src/shells/bold-local/BoldLocalCtaBanner.tsx`

All hrefs are bare absolute paths or protocol/external. Uses `<Link to="...">` throughout.

Href inventory:
- `<Link to="/">` — home
- `<Link to={link.href}>` — service pages
- `<Link to={link.href}>` — nav: `/about`, `/service-area`, `/contact`
- `<Link to="/quote">` — CTA
- Footer service links: `/mosquito-control`, `/ant-control`, `/roach-control`, `/termite-control`, `/rodent-control`, `/pest-control`
- Footer nav links: `/about`, `/blog`, `/service-area`, `/contact`
- `href={tel:...}` — phone (protocol)
- `href={mailto:...}` — email (protocol)
- `href="https://pestflowpro.com"` — powered-by (external)

Dead-route links (NOT fixed — separate investigation):
- `/blog` — footer line 22
- `/service-area` — navbar line 27, footer line 23

---

### rustic-rugged
Files checked:
- `src/shells/rustic-rugged/ShellNavbar.tsx`
- `src/shells/rustic-rugged/ShellFooter.tsx`
- `src/shells/rustic-rugged/ShellHero.tsx`
- `src/shells/rustic-rugged/RusticRuggedCtaBanner.tsx`

All hrefs are bare absolute paths or protocol/external. Uses `<Link to="...">` throughout.

Href inventory:
- `<Link to="/">` — home
- `<Link to={link.href}>` — service pages
- `<Link to={link.href}>` — nav: `/about`, `/service-area`, `/contact`
- `<Link to="/quote">` — CTA
- `href="/quote"` — hero CTA (bare `<a>` tag, line 98)
- `href="/pest-control"` — hero secondary CTA (bare `<a>` tag, line 99)
- `href={tel:...}` — phone (protocol)
- `href={mailto:...}` — email (protocol)
- `href="https://pestflowpro.com"` — powered-by (external)
- `href="#main-content"` — skip link (anchor)

Dead-route links (NOT fixed — separate investigation):
- `/service-area` — navbar line 27

---

## Conclusion

The `/tenant/${slug}/` prefix bug described in the S155.1 session prompt does **not exist** in the current codebase. All 5 shells already use bare absolute paths (`/about`, `/quote`, etc.) or React Router `<Link to="...">` with bare paths. No edits were required.

The only open routing concern is dead-route links (listed above) — those are explicitly out of scope per S155.1 instructions.
