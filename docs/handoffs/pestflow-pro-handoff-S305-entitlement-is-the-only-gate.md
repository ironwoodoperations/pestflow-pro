# S305 handoff — entitlement is now the only gate, and the deploy was actually verified

Sessions S304 → S305. **Two PRs merged, #305 and #306.** S304 made the demo plans
visible on the marketing surfaces; S305 removed the last gating read of
`settings.subscription` and **deployed it, byte-verified**.

**Durable lessons only.** Narrative lives in `PROJECT_MANIFEST.d/`; perishable
state in `docs/ROADMAP.md`. Neither is repeated here.

---

## 0. The S303 deploy-state rule got its first clean pass

S303's central lesson was that *"merged" is the last state Claude can observe, and
the gap gets filled wrongly* — a claim wrong three times running. This arc is the
first one to close that gap properly, and the method is worth copying:

- Merge landed `f643775`.
- **Before** claiming anything, `get_edge_function` was read. It returned **v18**,
  still containing `parseTier` and still gating on `settings.subscription` — i.e.
  the repo and production genuinely disagreed, and saying "shipped" would have
  been false.
- After the deploy: **v19, byte-diffed against `main` — identical, zero
  differences, sha256 `0364b2f7…6d8f` on both sides.**

> **A version increment is not evidence (S303 §4); a version increment plus a
> matching hash of the deployed body is.** The check that mattered was not
> "did the number go up" but "does the deployed bundle equal the merged source."
> Both files were confirmed shipped — `index.ts` **and**
> `_shared/secrets/stripVaultSecrets.ts` — because a partial bundle would have
> passed a version check and failed at runtime.

**Two MCP edge-deploy gotchas, recorded so they cost nobody another cycle:**

1. `entrypoint_path` must be the file's **key path** — `functions/<name>/index.ts`
   — not a bare `index.ts`. The bare form fails with *"Entrypoint path does not
   exist."* Loud, cheap, self-announcing.
2. **`verify_jwt` defaults to `true` in the MCP deploy tool and had to be passed
   explicitly as `false`.** This one is silent and expensive. `outscraper-reviews`
   does its own auth — `requireTenantUser` for user calls, a Vault cron-secret
   comparison for the scheduler — so a gateway flipped to `verify_jwt: true`
   would have **401'd the JWT-less cron caller** and quietly killed automated
   review syncing, with the function still reading ACTIVE and the code still
   correct.

> **The second is not a new hazard — it is the same one this repo has been bitten
> by since S273**, where the handoffs record *"verify_jwt toggle silently reverts
> to ON after every deploy — re-check both."* The mechanism is now named: the
> default is ON, so every deploy path that does not state the value **re-asserts
> the wrong one**. The rule is not "re-check after deploy", it is **pass it
> explicitly on every deploy and confirm it on read-back** — which is what
> happened here, and why the read-back check listed `verify_jwt` alongside the
> hash rather than treating it as incidental.

## 1. The gate and the button disagreed — and the button was the correct one

This is the finding that inverts the intuition, and the reason the bug was
invisible.

`outscraper-reviews` gated manual review refresh on `settings.subscription.tier`.
`TestimonialsTab.tsx:318` gates the same button with `FeatureGate minTier={4}` →
`usePlan()` → `tenants.entitlement`.

> **The frontend had been reading the source of truth all along. The server read
> the drifting copy.** So the exposure was **not** a hidden button. It was the
> mirror: a stale-HIGH `settings.subscription.tier` on a tenant whose
> `entitlement` sits below 4 would let a **direct API call** succeed while the UI
> correctly hid the control — a bypass with no visible symptom.

`parseTier` failed *open* in exactly one direction: absent key → 1 (safe), stale
high value → granted. Fail-closed on absence is not the same as fail-closed.

**Both validators reached this independently.** Perplexity: *"A stale-high
settings value could previously allow a direct API call even after a downgrade.
This diff removes that bypass."*

## 2. A brief can be wrong in its verified-context block, and was — twice

The S305 brief opened with "verified this session via MCP — do not re-derive."
Two of its statements were wrong, and both were caught only because Wave 1
actually read the code rather than trusting the preamble:

| brief said | actual |
|---|---|
| use a direct `tenants.select('entitlement')` | **six** gates already use `check_tenant_access`; `apply-finding-fix:170` does this *exact* tier-4 check that way. A direct read would be the only entitlement read a future change to the access rule could not reach. |
| unconfigured tenants "422 at `buildOutscraperQuery` **before** the tier gate" | **Reversed.** Gate at :98, integrations read at :127. A non-Elite tenant with no Google ID gets **403**, not 422. |

Neither changed the fix; the first changed the *implementation*, the second
changed the *QA expectations*. Both were raised at the Wave 1 stop and settled
before code was written.

> **"Verified, do not re-derive" is a claim about the author's confidence, not
> about the code.** It is worth honouring for expensive re-derivation (live DB
> state), and worth checking for anything a grep can settle in seconds.

## 3. A presence check is not a configuration check

Building the 9-tenant proof, `settings.integrations ? 'google_place_id'` reported
**seven** tenants configured. Only **two** are: the other five carry the key with
an **empty string** value, which `buildOutscraperQuery` treats as absent.

> Had the QA table used key-presence, it would have contradicted the brief's
> correct claim and "found" a discrepancy that does not exist. `nullif(trim(…),'')`
> is the check; `? 'key'` is not.

## 4. A behavioral no-op as the acceptance criterion, not a caveat

All nine tenants currently have `entitlement == settings.subscription.tier`, so
old path and new path were tabulated side by side in SQL and had to match **row
for row** — 9 of 9 did. Any difference would have meant the change was wrong.

Perplexity put the limit on that evidence precisely, and it is worth keeping:

> *"The behavioral no-op across the current nine tenants is useful rollout
> evidence, but it should not be treated as a security guarantee: the purpose of
> the change is precisely to remain correct when the two sources later diverge."*

## 5. Where a hand-maintained mirror is forced, say so at the copy site

S304 added `DemoTenant.tier`, duplicating `tenants.entitlement` by hand. Not
laziness — `/demos` and the homepage render with **no tenant session**, for five
tenants at once; there is no authenticated context and no public RPC exposing
entitlement, so the live value **cannot** be read at render time.

Mitigations: a `1 | 2 | 3 | 4` union so a typo fails `tsc`, and a header comment
stating the mirror relationship and the update obligation.

> **The comment lives at the site of the copy, not three directories away.** That
> is the whole difference from the S303 rot pattern, where corrections in ROADMAP
> and two handoffs were all overruled by a newer, wrong session log. A warning
> you must go looking for is a warning that expires.

Self-healing later, if wanted: a public RPC returning `(slug, entitlement)` for
demo-flagged tenants only. Deliberately not built — new surface area in a copy
session.

## 6. Two verdicts that disagreed, and holding both honestly

Gemini said the TOCTOU race *"does not exist here."* Perplexity said it exists,
is pre-existing, and is not widened by the diff. **Conservative-wins takes
Perplexity's.**

The appendix of `REVIEW_S305_…md` reproduces **both verbatim**, including
Gemini's overclaim — because verbatim means verbatim. The summary section
therefore quotes that exact phrase and says it is not adopted.

> **A verbatim record and a correct summary can contradict each other on the
> page. Name the contradiction in the summary rather than letting a reader who
> only reaches the appendix carry away the overclaim.** The same applies to the
> privilege question: both models agree calling a SECURITY DEFINER RPC from a
> service-role client is **privilege-NEUTRAL** — `service_role` could read
> `public.tenants` regardless. The RPC's value is **consistency and a single
> place to change the access rule**, never privilege reduction. The docs say so
> explicitly so nobody later "discovers" it as a flaw.

## 7. The validator gate is not Claude's to run, and a placeholder is worse than a gap

Perplexity and Gemini are unreachable from Claude Code Web. Wave 3 was therefore
**not attempted** and **no placeholder verdict was written**; the PR carried a
DO-NOT-MERGE banner naming the missing step until the real verdicts arrived.

> A fabricated verdict would have been indistinguishable from a real one in the
> file, and would have made the PR look mergeable on an incomplete record. The
> gap was the honest artifact.

---

## Verified live state (2026-08-28)

- **`outscraper-reviews` v19, ACTIVE, `verify_jwt: false`** — deployed from `main`
  @ `f643775` via Supabase MCP `deploy_edge_function`. Read-back **byte-diffed
  against `main`: identical, zero differences.** sha256 both sides
  `0364b2f74ee3e010d49de379e35348235a9cd8f2bd6a50ca111ad3cd77de6d8f`. Deployed
  body contains `check_tenant_access`; **zero** `settings.subscription`; **zero**
  `parseTier`. Both files shipped (`index.ts` + `_shared/secrets/stripVaultSecrets.ts`).
- **Zero gating reads of `settings.subscription` remain** anywhere in the repo or
  in any deployed function. The ROADMAP's long-standing "display metadata" claim
  is now true without exception.
- `check_tenant_access` — owner `postgres`, SECURITY DEFINER,
  `search_path=public`, **one** signature, EXECUTE `service_role` only
  (anon/authenticated false), `public` schema USAGE-only with `CREATE` false for
  both. Because `public` is not writable and `public.tenants` is schema-qualified
  in the body, the pinned `search_path` cannot be hijacked.
- All 9 tenants: `entitlement == settings.subscription.tier`. Only `dang` (4) and
  `pls` (3) have a Google identifier.
- **S304's apex render is still unconfirmed.** `/demos` renders only on
  `pestflowpro.ai` / `www.pestflowpro.ai`; localhost and the Vercel preview host
  both hit the "Site Not Found" gate, and the session's network policy denied the
  live domain. Verified by local browser walk on merged code instead.

## Open / pending (carried to next)

1. **Eyeball `pestflowpro.ai/demos`.** ~90 seconds, and the only unverified step
   from S304. Five cards, four distinct badges.
2. **`check_tenant_access` hardening** — the EXECUTE-ACL assertion and gate
   regression tests deferred from #306. **Seven consumers, not one.** Full block in
   `docs/ROADMAP.md`, including the `search_path = ''` decision left open.
3. **outscraper cron apikey rotation** — flagged independently by both validators.
   Possession authorizes paid refreshes for any tenant at any tier.
4. **`DemoTenant.tier` must be updated if any demo's entitlement changes.**
5. Everything carried from S303 is untouched — pls launch checklist, S300 turf
   entry, S296 stage 0, the four S303 ROADMAP items.
