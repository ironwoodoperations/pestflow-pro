// S339 — the outbound queue worker's DECISION LOGIC, kept pure and separate
// from index.ts so it can be tested. index.ts does I/O; everything that decides
// what a result MEANS lives here.
//
// ═══ THE ONE RULE THIS FILE EXISTS TO ENFORCE ═══
//
// `unknown` is NOT a flavour of `retryable`.
//
// Zernio's POST /api/v1/profiles has no idempotency key. If a request is SENT
// and the outcome is NOT OBSERVED — a timeout, an aborted socket, the edge
// runtime killed mid-flight — then a profile may or may not exist. Retrying
// blindly mints a second one: an orphan that breaks the one-profile-per-tenant
// model and confuses the Social tab.
//
// The database already defends this: `outbound_queue_claim` never returns an
// 'unknown' row, and `outbound_queue_requeue` REFUSES a zernio_profile requeue
// while vendor_ref is null. Both verified live. This file's job is simply not
// to defeat that by reporting a timeout as retryable.
//
// THE COSTS ARE ASYMMETRIC, and the classification leans on that:
//   unknown misread as retryable  -> a duplicate vendor profile. Silent, wrong,
//                                    needs manual cleanup at the vendor.
//   retryable misread as unknown  -> the job dead-ends and an operator requeues
//                                    it. Visible, safe, one command.
// So when delivery cannot be established, a duplicate-sensitive kind resolves
// to `unknown`. Guessing in the safe direction is the whole design.

/** The exact vocabulary public.outbound_queue_complete accepts. */
export type Outcome = 'succeeded' | 'retryable' | 'unknown' | 'terminal';

/** The kinds outbound_queue_kind_valid permits. Read from the live CHECK. */
export type QueueKind = 'zernio_profile' | 'outscraper_initial';

/**
 * Kinds where repeating a delivered-but-unobserved request creates a DUPLICATE
 * that cannot be undone from our side.
 *
 * zernio_profile is one: no idempotency key, and a second POST mints a second
 * profile. outscraper_initial is not: it starts a review sync that is safe to
 * run twice.
 */
export const DUPLICATE_SENSITIVE: ReadonlySet<QueueKind> = new Set<QueueKind>(['zernio_profile']);

/**
 * Map an HTTP STATUS to an outcome. Only call this when a response was actually
 * received — a status is proof the request completed.
 *
 *   2xx      succeeded, but only if the caller also got a usable id out of the
 *            body. A 2xx with nothing to record is handled by the caller as
 *            `unknown`, NOT succeeded: see classifyResponse below.
 *   429/5xx  retryable. The vendor told us to come back.
 *   4xx      terminal. 400/401/403/404 and validation errors will not start
 *            working on their own, and retrying five times just delays the
 *            operator finding out.
 */
export function classifyStatus(status: number): Outcome {
  if (status >= 200 && status < 300) return 'succeeded';
  if (status === 429) return 'retryable';
  if (status >= 500) return 'retryable';
  if (status >= 400) return 'terminal';
  // 1xx/3xx reaching here means something unusual happened; treat as retryable
  // rather than burning the job on a state we have not characterised.
  return 'retryable';
}

/**
 * A response arrived. Decide the outcome, accounting for the body.
 *
 * `hasUsableRef` is the caller's answer to "did I get something worth storing
 * as vendor_ref?". A 2xx WITHOUT one is deliberately NOT `succeeded`: the
 * vendor may well have created the thing, and we have no id to prove it or to
 * reconcile against later. That is the definition of an unobserved outcome, so
 * for a duplicate-sensitive kind it resolves to `unknown` and dead-ends for a
 * human rather than looping into duplicates.
 */
export function classifyResponse(
  status: number,
  hasUsableRef: boolean,
  kind: QueueKind,
): Outcome {
  const base = classifyStatus(status);
  if (base === 'succeeded' && !hasUsableRef) {
    return DUPLICATE_SENSITIVE.has(kind) ? 'unknown' : 'retryable';
  }
  return base;
}

/**
 * Errors that prove the request NEVER REACHED the vendor.
 *
 * Only these are safe to call retryable for a duplicate-sensitive kind, because
 * nothing can have been created. Deliberately narrow and matched on substrings
 * Deno actually emits — anything not on this list is treated as "we do not
 * know", which is the safe side.
 */
const PRE_DISPATCH_PATTERNS: readonly string[] = [
  'dns error',
  'failed to lookup address',
  'name or service not known',
  'connection refused',
  'tcp connect error',
  'invalid url',
];

/** Errors that positively indicate the request WAS in flight when it died. */
const IN_FLIGHT_PATTERNS: readonly string[] = [
  'timed out',
  'timeout',
  'operation was aborted',
  'aborterror',
  'the signal has been aborted',
  'connection reset',
  'connection closed before message completed',
  'broken pipe',
  'unexpected eof',
];

/**
 * Map a THROWN error to an outcome. This is the function the whole design turns
 * on, and the mutation test targets it specifically.
 *
 * For a duplicate-sensitive kind the default is `unknown`. `retryable` is
 * returned ONLY when the error proves the request never left — a DNS failure or
 * a refused connection. Everything else, including anything unrecognised,
 * resolves to `unknown`, because "I do not recognise this error" is exactly the
 * case where I cannot claim the vendor saw nothing.
 *
 * For a kind that is not duplicate-sensitive the calculus flips: repeating is
 * harmless, so transient errors stay retryable.
 */
export function classifyThrownError(err: unknown, kind: QueueKind): Outcome {
  const msg = (err instanceof Error ? `${err.name} ${err.message}` : String(err ?? '')).toLowerCase();

  if (!DUPLICATE_SENSITIVE.has(kind)) {
    return 'retryable';
  }

  for (const p of PRE_DISPATCH_PATTERNS) {
    if (msg.includes(p)) return 'retryable';
  }
  // Named explicitly so the intent is readable, though the fall-through below
  // would reach the same answer. An in-flight death is the canonical `unknown`.
  for (const p of IN_FLIGHT_PATTERNS) {
    if (msg.includes(p)) return 'unknown';
  }
  return 'unknown';
}

/** Zernio returns the id in one of several shapes. Mirrors provision-tenant. */
export function extractZernioProfileId(body: unknown): string | null {
  const b = body as Record<string, any> | null | undefined;
  const raw = b?.profile?._id ?? b?.profile?.id ?? b?.id ?? b?._id;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

export interface ClaimedJob {
  id: string;
  tenant_id: string;
  kind: QueueKind;
  payload: Record<string, unknown>;
  attempts: number;
  vendor_ref: string | null;
  prior_status: string;
}

/**
 * MUST the worker reconcile against the vendor before issuing a create?
 *
 * True whenever a previous attempt might already have created something:
 *
 *   vendor_ref set          we already hold an id — there is nothing to create,
 *                           and this is the common reconcile path.
 *   prior_status 'unknown'  a previous attempt was delivered-but-unobserved.
 *   prior_status 'processing'  AN ABANDONED LEASE. The previous worker claimed
 *                           this row and never completed it — killed mid-flight,
 *                           runtime recycled. Its request may well have been
 *                           sent. This case is NOT named in the brief and is
 *                           reachable today: outbound_queue_claim re-claims a
 *                           'processing' row once its lease expires, and returns
 *                           prior_status='processing'. Treating it as a fresh
 *                           create is exactly how a duplicate gets minted.
 *
 * Note on 'unknown': as the live claim function is written, an 'unknown' row is
 * never re-claimed, so prior_status can only be 'pending', 'retryable_failed'
 * or 'processing'. The check is kept anyway — it costs nothing, it documents
 * the intent, and it stays correct if the claim predicate ever widens.
 */
export function needsReconcileBeforeCreate(job: Pick<ClaimedJob, 'vendor_ref' | 'prior_status' | 'kind'>): boolean {
  if (!DUPLICATE_SENSITIVE.has(job.kind)) return false;
  if (job.vendor_ref !== null && job.vendor_ref !== undefined && String(job.vendor_ref).trim() !== '') return true;
  return job.prior_status === 'unknown' || job.prior_status === 'processing';
}

/** The three id fields outscraper-reviews can work from. Mirrors step 10. */
export function hasGoogleId(integrations: unknown): boolean {
  const i = (integrations ?? {}) as Record<string, unknown>;
  const any3 = [i.google_cid, i.google_fid, i.google_place_id];
  return any3.some((v) => v !== null && v !== undefined && String(v).trim() !== '');
}

/**
 * The settings.integrations value to write on a successful Zernio create.
 *
 * A MERGE, NOT A REPLACE: dang carries 23 keys here, OAuth tokens among them,
 * and a whole-value write would destroy every key this function does not know
 * about. That is the S292 defect.
 *
 * A PLAIN SPREAD, NOT mergeSettingsValue — and that is the trap provision-tenant
 * step 8 documents at length. `zernio_last_error: null` is a DELIBERATE CLEAR:
 * it exists so a tenant provisioned before ZERNIO_API_KEY was set stops reading
 * "not configured" once it is. mergeSettingsValue treats null as an EMPTY
 * OVERLAY and would refuse to let it overwrite a non-empty existing error —
 * silently dropping the very clear this write is for.
 *
 * Through stripVaultSecrets, like every sibling writer: the DB trigger
 * trg_strip_settings_secrets is authoritative and would strip them anyway, but
 * a write that carries one raises a WARNING and files a settings_secret_leak_obs
 * row every time. `strip` is injected rather than imported so this module stays
 * pure and testable.
 */
export function buildZernioIntegrationsValue(
  current: unknown,
  profileId: string,
  strip: (v: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> {
  const base = strip(((current ?? {}) as Record<string, unknown>));
  return { ...base, zernio_profile_id: profileId, zernio_last_error: null };
}

/**
 * Fields safe to log. S313: a raw Resend body echoed a recipient's address into
 * function logs. Never log the key, a fragment of it, or an upstream body.
 */
export function logLine(stage: string, job: Pick<ClaimedJob, 'id' | 'tenant_id' | 'kind' | 'attempts'>, outcome?: Outcome, reason?: string): string {
  const parts = [
    `[process-outbound-queue] ${stage}`,
    `job=${job.id}`,
    `tenant_id=${job.tenant_id}`,
    `kind=${job.kind}`,
    `attempts=${job.attempts}`,
  ];
  if (outcome) parts.push(`outcome=${outcome}`);
  if (reason) parts.push(`reason=${reason}`);
  return parts.join(' ');
}
