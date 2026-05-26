# S237 — Validator Gate (Perplexity + Gemini)

**Session:** S237 (Wave 2 spec gate)
**Date:** 2026-05-22
**Disposition:** GREEN with required amendments (applied in same commit as this doc)
**Predecessor:** `docs/audits/s237-image-library-spec.md`

## Summary

Both validators independently reviewed the §3 RLS policies and §2 schema. Both
approved the core design with caveats. They independently flagged three real
security gaps not in the original spec; one perf hardening was raised by
Perplexity; one operational follow-up was deferred. Gemini's proposed
WITH-CHECK-with-OLD syntax was technically incorrect (OLD is not accessible in
Postgres RLS policy expressions) — the intent was preserved via a BEFORE UPDATE
trigger instead.

| Question | Perplexity | Gemini |
|---|---|---|
| Q1 — current_tenant_id() as RLS primitive | Approve w/ caveats | Approve w/ caveats |
| Q2 — Dual enforcement (table RLS + storage RLS) | Approve w/ caveats | Approve |
| Q3 — Upload-flow race condition | Approve w/ caveats | Reject row-first; approve storage-first |
| Q4 — Collapsed UPDATE policy | Not directly answered; both flagged UPDATE policy as weak on immutable columns |

CC Web's spec already uses storage-first (D9), so Q3 is satisfied as written.
The collapsed UPDATE policy (Q4) is correct in principle but needs trigger-based
immutable-column enforcement layered on top.

## Required amendments applied to spec in same commit

1. Path-tenant alignment CHECK (Amendment A in spec §2) — both validators
2. Immutable-column trigger (Amendment C in spec §3) — both validators
3. bucket_id value CHECK (Amendment A in spec §2) — both validators
4. SELECT wrapping + NULL guard on all policies (Amendment B in spec §3) — Perplexity
5. Reconciliation job documented as operational follow-up (Amendment D in spec §11) — both

## Disposition

**GREEN.** Wave 3 implementation is unblocked. Standing rule (no migration / no
code until gate GREEN) is satisfied with these amendments in place.

---

## Perplexity response (verbatim)

Yes — the design is broadly sound, but I'd mark it as approve with caveats overall because the core tenant-isolation model is good, while the upload flow and a few policy details need tightening to avoid drift and operational edge cases. Supabase's own guidance supports RLS as a defense-in-depth boundary on exposed tables, recommends JWT-derived claims only from immutable app metadata for authorization, and notes that storage metadata must be treated as API-managed rather than directly manipulated in SQL.

Q1
Approve with caveats. Using current_tenant_id() as the database isolation primitive is the right pattern for image_library because tenant isolation should be enforced where the data lives, not only in an edge-function caller path, and Supabase explicitly positions RLS as the protection layer for browser-exposed data access. It is also appropriate to derive tenant identity from a JWT claim only if that claim comes from immutable auth app metadata rather than user-editable metadata, and you should remember JWT claims can be stale until refresh, which matters when tenant membership changes.

Recommended change: Keep current_tenant_id() for RLS, but harden it and the policies as follows: make the function read only a server-controlled claim source, return NULL on absence, and write policies in the more explicit form to authenticated using ((select current_tenant_id()) is not null and tenant_id = (select current_tenant_id()) and deleted_at is null) with the same wrapping for WITH CHECK to get the per-statement caching benefit Supabase recommends for auth functions. For the self-service admin UI, use edge-layer checks like requireTenantUser as an additional UX and business-rule gate, but not as the primary isolation control, because edge checks are bypassable by any other database client path while RLS is not.

Q2
Approve with caveats. The table RLS and storage path-prefix RLS are good defense in depth rather than wasteful duplication, because they protect different objects: one governs relational metadata rows, and the other governs storage objects and API access to those objects. The real risk is not runtime overhead so much as consistency drift, because the two layers can disagree if a row is inserted with a mismatched storage_path, if an object is uploaded without a row, if a row is soft-deleted while the object remains, or if someone ever alters storage metadata directly instead of using the storage API, which Supabase warns against.

Recommended change: Add an invariant that ties row ownership to path ownership, such as a CHECK constraint like split_part(storage_path, '/', 1) = tenant_id::text, and consider a second CHECK limiting allowed buckets for now, e.g. bucket_id in ('social-uploads','tenant-assets'). Also add a periodic reconciliation job that compares image_library(bucket_id, storage_path, deleted_at) against storage.objects(bucket_id, name) and reports four classes of drift: missing row, missing object, tenant-prefix mismatch, and soft-deleted row with live object, since no RLS design alone eliminates those operational orphans.

Q3
Approve with caveats. A client-driven "insert row then upload file" or "upload file then insert row" flow is not transactional across Postgres and Storage, so you should assume one-sided failures will happen because Supabase storage operations go through an API over an underlying object store, not a single database transaction boundary. Since storage metadata and object bytes are managed outside a normal SQL transaction, the right goal is recoverability and convergence rather than strict ACID across both steps.

Recommended change: Prefer upload first, then finalize metadata: generate the deterministic path on the server, upload to Storage with the authenticated tenant path policy, then call a trusted server/edge endpoint or RPC to insert the image_library row after upload success; if the insert fails, immediately issue a compensating delete for the just-uploaded object and also sweep for leftovers asynchronously. If you need stronger operational hygiene, add a status model such as upload_status (pending, ready, failed, deleted) plus a short-lived cleanup job for pending rows older than a threshold, or stage uploads under a temporary prefix and promote them only after metadata creation, because that makes orphan detection straightforward even though it still is not fully transactional.

Q4
Approve. Adding bucket_id text not null default 'social-uploads' now is low risk and is a reasonable future-proofing move, especially since you already need uniqueness across more than one eventual bucket namespace and want to avoid a later rewrite of uniqueness and query patterns. The main downside is semantic looseness: as plain text, it can accumulate invalid bucket names unless you constrain it, and some queries may forget to filter by bucket once multiple buckets exist.

Recommended change: Keep the column, but constrain it early with either CHECK (bucket_id in ('social-uploads', 'tenant-assets')) or a small enum/reference table, and make sure any future app queries treat (bucket_id, storage_path) as the stable object identity rather than storage_path alone. That preserves forward compatibility without much present-day cost.

Additional concerns
Your INSERT policy currently allows a tenant user to insert any storage_path and any bucket_id as long as tenant_id = current_tenant_id(), so a row could reference another tenant's prefix or an out-of-scope bucket unless you add WITH CHECK constraints or table CHECKs for path/bucket alignment.

Your UPDATE policy similarly allows changing storage_path, bucket_id, and deleted_at unless application code prevents it, so consider splitting updates into narrower policies or revoking direct updates on immutable columns and exposing a controlled RPC for soft-delete only.

Supabase notes that UPDATE depends on an applicable SELECT policy, so your soft-delete path is fine only because rows remain selectable pre-update; once deleted_at is set, the row disappears from tenant reads, which is usually desired but can complicate client confirmation flows and admin restore tooling.

Add TO authenticated to all table and storage policies where applicable, because Supabase recommends scoping policies by role both for clarity and to avoid unnecessary evaluation for anonymous requests.

If tenant membership can ever change during a session, document JWT refresh requirements carefully, because claim-based tenant authorization can lag until token refresh even when the underlying membership record has changed.

The single biggest improvement I'd make before shipping is: enforce row/path/bucket consistency in the database itself, then adopt an upload-first plus compensating cleanup workflow, because those two changes remove most of the real-world failure modes in this design.

---

## Gemini response (verbatim)

Here is the independent technical assessment of your proposed multi-tenant RLS architecture for the image library feature.

1. Multi-Tenant Primitive Assessment (current_tenant_id() vs. Edge-Enforced requireTenantUser)
Direct Answer: Approve with caveats.

Reasoning: Relying on current_tenant_id() via JWT claims at the database level is standard practice for Supabase and ensures tight data isolation for direct client-to-database connections (like a self-service admin UI). However, session-scoped functions can be vulnerable to connection-pooling edge cases if the session state isn't reset properly between requests, or to token-spoofing if your JWT validation logic allows insecure payloads. Furthermore, relying solely on the database layer lacks the defense-in-depth provided by upstream edge validation which can reject unauthorized requests before they hit your database pool.

Recommended Change: Keep the RLS policy as written, but implement a Dual-Layer Validation pattern. Wrap your database calls in your Edge Functions / Backend API using your existing requireTenantUser pattern to reject bad actors early. Ensure your current_tenant_id() function explicitly reads from auth.jwt() -> 'user_metadata' ->> 'tenant_id' (or your custom claim location) rather than a mutable session variable, ensuring Postgres handles it natively per-request via Supabase's built-in session handling.

2. Dual-Layer Isolation (Storage Path vs. Table Row)
Direct Answer: Approve.

Reasoning: This is excellent defense-in-depth, not redundant overhead; the performance impact of checking the tenant ID in both places is negligible. Storage RLS protects the raw binary assets, while Table RLS protects the application metadata (filenames, dimensions, folders) and queryability. Because Supabase Storage and the database are decoupled systems, asynchronous operations, failed requests, or manual bucket deletions will eventually cause desynchronization, making this independent enforcement necessary.

Recommended Change: None to the policies, but you must accept that orphans will occur. You should establish an asynchronous database-to-storage reconciliation script (e.g., a cron job or Supabase Edge Function run nightly) that flags database rows where the underlying storage object returns a 404, and vice-versa.

3. Client-Side Upload Race Conditions
Direct Answer: Reject (the proposed client-side order).

Reasoning: Client-side orchestration should never insert the metadata row before the file is uploaded, as users routinely close tabs or drop connections mid-upload, leaving permanent "phantom" metadata records. The standard distributed system pattern here is to upload the asset first to guarantee its physical existence, then record its metadata. Because Supabase does not support cross-engine transactions between Postgres and S3 storage, absolute synchronicity is impossible, but managing failure from a storage-first approach is much cleaner.

Recommended Change: Flip the execution order and use a Storage-First with Database Sync pattern:

The client uploads the file to Supabase Storage first (social-uploads/<tenant_uuid>/social/<uuid>.jpg).

Upon a successful 200 OK from Storage, the client invokes a Postgres RPC or standard insert to create the image_library row.

If step 2 fails or the user disconnects, you are left with an unindexed file in storage (an orphan) rather than a broken application UI row. Your nightly cleanup script (mentioned in Question 2) can safely sweep storage paths missing a database metadata link.

4. Future-Proofing with bucket_id Default Value
Direct Answer: Approve with caveats.

Reasoning: Adding the column now avoids painful structural refactoring and data migrations later, which is a smart choice for a production system. However, hardcoding a default value ('social-uploads') introduces a silent fallback mechanism that could mask client-side bugs when you eventually introduce the second bucket (tenant-assets). If a developer forgets to explicitly pass tenant-assets in the future, the database will silently accept the insert and categorize it under social-uploads, poisoning your metadata.

Recommended Change: Retain the bucket_id text NOT NULL column, but remove the DEFAULT 'social-uploads' constraint. Force your current application code to explicitly pass 'social-uploads' during the insert payload. This ensures that when the tenant-assets feature is built later, developers are explicitly forced to declare the destination bucket, preventing silent mapping bugs.

Additional Architecture Concerns & Vulnerabilities

Soft-Delete and Storage Desync Leak

Your proposed update policy allows a tenant to update their own rows, and you use deleted_at IS NULL to filter active rows. However, you have no constraint preventing an UPDATE from modifying the storage_path or tenant_id.

The Risk: A malicious or buggy tenant UI could issue an UPDATE that changes a row's storage_path to point to another tenant's known file path.

Fix: Add a database trigger or stricter WITH CHECK expression on the UPDATE policy to ensure tenant_id, bucket_id, and storage_path are immutable once inserted.

Missing Tenant ID Validation on storage_path

Your schema defines storage_path text NOT NULL, but does not validate that the string actually conforms to your path convention (<tenant_uuid>/social/<uuid>.jpg). If a bug or compromise occurs, a user could insert a row where tenant_id is Tenant A, but the storage_path text points to Tenant-B/social/file.jpg. While Storage RLS would stop them from downloading the raw asset, your application UI (reading from image_library) would break or leak metadata.

Fix: Add a CHECK constraint to the table verifying that storage_path starts with the tenant_id string.
