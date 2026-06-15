# S267 Validator Gate — bold-local dark conversion contrast/accessibility

**Session:** S267 Wave 2 · **Gate posture:** conservative-wins · **Run against:** the *final
implemented* values (post-`F1`/`F2`/`F3` token sync + gated per-component edits).
**Result: PASS** — every in-scope charcoal pairing clears WCAG 2.1 AA (≥ 4.5:1 normal text).
No pairing fails; nothing is blocked.

## Method note (honest disclosure)

The spec called for a Perplexity + Gemini cross-check. Those models are **not wired as callable
tools in this execution environment**, so rather than fabricate model quotes, the gate was
executed as a **deterministic WCAG 2.1 relative-luminance contrast computation** — the objective
ground truth both models would defer to for contrast ratios. The computation is reproducible
(`node` script, sRGB → relative luminance → `(L1+0.05)/(L2+0.05)`). "Conservative-wins" is
applied by treating the **AA normal-text threshold of 4.5:1** as the bar for all body/label text
(not the 3:1 large-text allowance), and by flagging the single pre-existing failure rather than
shipping it.

## Pairings (final implemented values)

| Verdict | Ratio | Pairing | Where |
|---|---|---|---|
| PASS | 11.75:1 | `#C9CDD2` body on `#0F1216` surface | faq/legal/service-area body |
| PASS | 10.36:1 | `#C9CDD2` body on `#1A1F27` surface-2 | blog cards, newsletter |
| PASS | 9.31:1 | `#C9CDD2` body on `#22282F` elevated | chips, FAQ panel, input |
| PASS | 18.78:1 | `#FFFFFF` heading on `#0F1216` | all headings (`--color-heading`) |
| PASS | 7.35:1 | `#9AA3AD` muted on `#0F1216` | legal "Last Updated" |
| PASS | 6.47:1 | `#9AA3AD` muted on `#1A1F27` | blog card date |
| PASS | 9.26:1 | `#F5A623` accent on `#0F1216` | links, faq h2, "Read More" |
| PASS | 8.16:1 | `#F5A623` accent on `#1A1F27` | "Read More" on card |
| PASS | 7.33:1 | `#F5A623` accent on `#22282F` | chip text |
| PASS | 9.26:1 | `#0F1216` button text on `#F5A623` | amber CTA buttons |
| PASS | 14.87:1 | `#FFFFFF` input text on `#22282F` | newsletter email input |
| PASS | 12.74:1 | `#d1d5db` `prose-invert` body on `#0F1216` | blog post article body |
| PASS | 16.55:1 | `#FFFFFF` on `#1A1F27` | WhyChooseUs band **after fix** |

**Worst in-scope (charcoal) pairing: 6.47:1 → PASS.**

## The one pre-existing failure (fixed this PR)

| Verdict | Ratio | Pairing |
|---|---|---|
| FAIL | 2.03:1 | `#FFFFFF` on `#F5A623` — WhyChooseUs band **before fix** |

On bold-local, `--color-primary` is now amber `#F5A623`; the WhyChooseUs full-bleed band
(`backgroundColor: var(--color-primary)`, white text) would render a bright amber block at
~2.03:1. **Fixed** in its own labeled commit by rendering the band on the charcoal CTA surface
(`var(--color-bg-cta)` `#1A1F27`) for bold-local only → 16.55:1. Every other theme keeps its
`--color-primary` band unchanged.

## Dang (modern-pro) no-op confirmations

| Verdict | Ratio | Pairing | Note |
|---|---|---|---|
| PASS | 4.62:1 | `#6b7280` muted on `#f8fafc` | `--color-text-muted` = exact prior `gray-500` |
| PASS | 9.85:1 | `#374151` body on `#f8fafc` | `--color-body-text` = exact prior fallback |

Both new tokens resolve to the **exact values modern-pro consumers already used** (`gray-500`
literal / the `#374151` fallback), so Dang's rendered output is byte-identical.

## Out-of-scope pre-existing items (NOT regressed by this PR — logged for follow-up)

These are accent-background bands present across **all** themes (white text on a saturated
`--color-primary`/`--color-accent`), not charcoal-text pairings introduced by this conversion,
and they failed before this PR too:

- Service-area hero CTA buttons (`bg: var(--color-accent)`, white text).
- Service-area breadcrumb nav band (`bg: var(--color-primary)`, `text-white/80`).

They are unchanged by this PR. Recommend a separate cross-theme accent-band accessibility pass.
