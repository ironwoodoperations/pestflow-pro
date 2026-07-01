// Dang comic shell design tokens — STUB ONLY.
// The full comic palette + type scale (Bangers / Open Sans, the `.text-comic`
// system, halftone/panel treatments) land in PR 4. This stub exists so the
// scaffold's layout branch has a `--dang-*` token block to reference, following
// the bold-local precedent (BL_TOKENS). Canonical brand accent is #F26B0F
// (locked in the PR #226 death-audit — do not change).
export const DANG_TOKENS = [
  '--dang-surface:#FFFFFF',
  '--dang-text:#111111',
  '--dang-accent:#F26B0F',
].join(';') + ';';
