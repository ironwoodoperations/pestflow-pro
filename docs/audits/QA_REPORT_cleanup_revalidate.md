# QA Report — cleanup: revalidate body shape (item 1)

**Branch:** `cleanup/revalidate-grep-and-provision-url` · No source code changes (docs-only PR). No tests, migrations, or deploys.

## Verification
| Check | Result |
|---|---|
| Revalidate routes enumerated repo-wide (`route.ts`, `revalidateTag`/`revalidatePath`) | ✅ exactly one: `app/api/revalidate/route.ts` (no apex/Vite route in this repo) |
| Body destructure + reads surfaced verbatim (route + schema + client) | ✅ see REVIEW (route L27/33/55; `cacheTags.ts:27`; `src/lib/revalidate.ts:27`) |
| `RevalidatePayload` union is the validator (no zod) | ✅ |
| Item 2 (`provision-tenant` `.com→.ai`) — file protected | ✅ Edit blocked by protect-files.sh; deferred per Scott to a future authorized edge-fn cleanup PR (bundled with item 4) |
| MCP read (master legal content) to assess item-2 search patterns | ✅ read-only; `terms/privacy/sms-terms/accessibility` use `pestflowpro.ai`, not `.com` → lines 877-880 are dead no-ops today |
| `git diff` touches source? | ✅ no — only `docs/audits/REVIEW_cleanup_revalidate.md` + this file |

## Verdict
PASS. Item 1 delivered (body shape surfaced for the orchestrator's MCP calls). Item 2 deferred with the exact diff captured for the follow-up PR. No redeploy in this PR — orchestrator handles deploy post-merge.
