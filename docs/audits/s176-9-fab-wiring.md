# S176.9 — FAQ Chat FAB Wiring

## Punchline
- Wiring pattern: **DIRECT BROWSER** — calls `api.anthropic.com/v1/messages` directly from the client bundle; no edge function involved
- Portability to standalone: **REQUIRES NEW ENV VAR** — `VITE_ANTHROPIC_API_KEY` must be added to the standalone Vercel project's environment variables
- S177 impact: **one extra Vercel env var** — the component itself copies over unchanged

---

## Component location
- File: `src/shells/dang/pages/DangFaqAiChat.tsx:14`
- Mounted by: `src/shells/dang/pages/FAQPage.tsx:244` (lazy-loaded on FAB click)

---

## Network call
- Pattern: direct `fetch` to Anthropic's Messages API from the browser
- Endpoint: `https://api.anthropic.com/v1/messages` (`DangFaqAiChat.tsx:32`)
- Payload shape:
  ```json
  {
    "model": "claude-sonnet-4-6",
    "max_tokens": 512,
    "system": "<SYSTEM_PROMPT>",
    "messages": [
      { "role": "user" | "assistant", "content": "<text>" },
      ...
    ]
  }
  ```
  Full conversation history is sent on every turn (`DangFaqAiChat.tsx:44`).
- Response shape: `data.content[0].text` — standard Anthropic Messages API response; fallback on error: `'Sorry, I had trouble with that. Please call us at (903) 871-0550.'` (`DangFaqAiChat.tsx:48`)

---

## If edge function: deployment status
- N/A — no edge function involved

---

## If direct browser: env var
- Variable name: `VITE_ANTHROPIC_API_KEY`
- Where it's read: `src/shells/dang/pages/DangFaqAiChat.tsx:35`
  ```ts
  'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
  ```
- Security note: `anthropic-dangerous-direct-browser-access: 'true'` header is set (`DangFaqAiChat.tsx:37`), which is the required Anthropic-blessed pattern for browser-direct usage; the anon key is exposed in the JS bundle by design

---

## FAQ context source for the prompt
- **Hardcoded in the component** — `SYSTEM_PROMPT` is a static string constant defined at `src/shells/dang/pages/DangFaqAiChat.tsx:8`; no DB lookup, no `page_content`, no `faqs` table read
- The system prompt is already Dang-specific, mentioning "Dang Pest Control in Tyler, Texas", East Texas pest species, and the phone number `(903) 871-0550`
- File:line: `src/shells/dang/pages/DangFaqAiChat.tsx:8`
- Implication for S178 (FAQ port to standalone): **none** — component ports as-is; system prompt already targets the standalone business, requires no adjustment for the hardcoded-array data path recommended in S176.8

---

## Tenant context required?
- **No** — the request body contains no `tenant_id`, no slug, no tenant-derived context; the system prompt is a hardcoded string
- Implication for S177 single-tenant deployment: zero wiring work; the component is already single-tenant by construction

---

## Recommendation for S177
Copy `DangFaqAiChat.tsx` verbatim into the standalone repo at `src/components/DangFaqAiChat.tsx` (or `src/pages/` alongside `FAQPage.tsx`). Add `VITE_ANTHROPIC_API_KEY` to the standalone Vercel project's environment variables — this is the same key already in the PFP Vercel project and Doppler under that name. No code changes are needed. The system prompt, model string (`claude-sonnet-4-6`), and `anthropic-dangerous-direct-browser-access` header all satisfy CLAUDE.md non-negotiables and require no editing. The FAB will work immediately once the env var is present.
