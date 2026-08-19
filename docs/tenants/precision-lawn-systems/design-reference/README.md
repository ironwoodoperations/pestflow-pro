# Design reference — Precision Lawn Systems

Static HTML renders approved by the client. **Layout and hierarchy intent only.**
Not markup to port. The shell's existing components win on structure.

| File | What it is |
|---|---|
| `home.html` | Desktop homepage (1440px) |
| `service.html` | Desktop service page — French drains / Tyler (1440px) |
| `mobile.html` | Mobile homepage (430px) |

## Palette

Declared in each file's `:root`:

| Token | Hex | Role |
|---|---|---|
| `--deep` | `#0E3B44` | Hero, nav |
| `--deeper` | `#092A31` | Top bar, footer, spec strip |
| `--water` | `#2E9D8F` | Accent, buttons, links |
| `--clay` | `#B4653A` | CTA band, warranty callout rule |
| `--paper` | `#F2F4F1` | Page background |
| `--ink` | `#14211F` | Body text |

Type: Archivo (headings/body), IBM Plex Mono (eyebrows, spec strip, credentials).

## How this maps to the build

Implemented as the `modern-pro` shell with a hand-authored
`PALETTE_HERO['#0e3b44']` entry in **both** twin files
(`shared/lib/shellCssVars.ts` and `src/lib/shellThemes.ts`).

The custom-derivation path is not used: `darkenHex('#0E3B44', 0.35)` crushes to
`#051518` (near-black), because that path assumes `primary_color` is a mid-tone
brand color with headroom to darken. `#0E3B44` is already a hero surface.

`metro-pro` / `mtp-4` is the closest stock theme and is Pro/Elite gated. It is
noted as an upgrade path only — the real upgrade carrot for this tenant is
location pages (5 → 10), not the theme.

## Elements to carry across, by intent

- **Spec strip** under the hero — license number, warranty, founded year,
  counties. Mono type, small caps, wide tracking.
- **Warranty callout** — large numeral, clay left rule, one-sentence
  differentiator against the market norm.
- **Town chips** — service-area coverage. Note that at Growth only 5
  `service_areas` rows exist; the full town list comes from
  `settings.seo.service_areas`, not the table.
- **Before/after pairs** on service pages, each with a descriptive caption.
- **Sticky mobile call bar** — tap-to-call plus estimate, side by side.

## Constraints these renders must not override

See `../BUILD-SPEC-v2.md` for the full list. The ones most likely to be
violated by working from these files directly:

- No equipment or controller brand names anywhere.
- No street address until the PO Box vs. 700 Francis St conflict is resolved.
- No business hours until confirmed.
- No `AggregateRating` — zero Google reviews exist.
- "Lawn" appears only in the legal entity name, the domain, and the footer
  copyright. Never in a heading, title, meta, alt text, or schema description.
- No retaining-wall references — the service line was discontinued.
- "Serving East Texas since 2017." Never "10 years of experience."

Note that this directory path contains "lawn" by necessity. Scope any CI check
for stray "lawn" usage to rendered output and `src/`, or it will flag this
folder permanently.
