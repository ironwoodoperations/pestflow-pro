// Pure-function unit tests for the send-sms quiet-hours gate.
// No network calls, no DB. Mocks `now` via injected parameter (not global Date).
//
// Run:
//   deno test supabase/functions/send-sms/_test.ts --allow-env
//
// Tests pin to 2026-01-15 (winter DST-stable: CST = UTC-6, EST = UTC-5) so we
// can build mocked instants by hand without timezone library.

import { assert, assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { decideDispatch } from './index.ts'

// Build a UTC Date that represents `localHour:localMin` in a fixed-offset zone
// on 2026-01-15 (winter, no DST shenanigans).
//   CST = UTC-6  → utcHour = localHour + 6
//   EST = UTC-5  → utcHour = localHour + 5
function utcInstant(localHour: number, localMin: number, offsetHoursFromUtc: number): Date {
  // offset is the zone's offset from UTC, e.g. -5 for EST. utcHour = local - offset.
  const utcHour = localHour - offsetHoursFromUtc
  // Date.UTC handles day-rollover when utcHour >= 24 or < 0.
  return new Date(Date.UTC(2026, 0, 15, utcHour, localMin, 0))
}

const CST = -6  // America/Chicago in January
const EST = -5  // America/New_York in January

// Helper: extract local hour:minute components in zone for assertion.
function localHM(d: Date, timeZone: string): { hour: number; minute: number; year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
  return {
    year: get('year'), month: get('month'), day: get('day'),
    hour: get('hour') % 24, minute: get('minute'),
  }
}

Deno.test('TX number + lead-notification + 23:00 CT → send-now (bypass)', () => {
  const now = utcInstant(23, 0, CST)
  const r = decideDispatch('19035551234', 'lead-notification', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('TX number + appointment-reminder + 23:00 CT → send-now (state not gated)', () => {
  const now = utcInstant(23, 0, CST)
  const r = decideDispatch('19035551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('FL (305) + appointment-reminder + 19:00 ET → send-now (in window)', () => {
  const now = utcInstant(19, 0, EST)
  const r = decideDispatch('13055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('FL (305) + appointment-reminder + 21:00 ET → queue, target = next-day 08:00 ET', () => {
  const now = utcInstant(21, 0, EST)
  const r = decideDispatch('13055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'queue')
  if (r.kind !== 'queue') return
  const local = localHM(r.targetSendAt, 'America/New_York')
  assertEquals(local.hour, 8)
  assertEquals(local.minute, 0)
  assertEquals(local.day, 16) // next day
})

Deno.test('FL panhandle (850) + appointment-reminder + 20:30 CT → queue, target = next-day 08:00 CT', () => {
  const now = utcInstant(20, 30, CST)
  const r = decideDispatch('18505551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'queue')
  if (r.kind !== 'queue') return
  assertEquals(r.timezone, 'America/Chicago') // NPA 850 override beats FL state default
  const local = localHM(r.targetSendAt, 'America/Chicago')
  assertEquals(local.hour, 8)
  assertEquals(local.minute, 0)
  assertEquals(local.day, 16)
})

Deno.test('OK (405) + appointment-reminder + 11:00 CT → send-now (in window)', () => {
  const now = utcInstant(11, 0, CST)
  const r = decideDispatch('14055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('OK (405) + appointment-reminder + 07:30 CT → queue, target = today 08:00 CT', () => {
  const now = utcInstant(7, 30, CST)
  const r = decideDispatch('14055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'queue')
  if (r.kind !== 'queue') return
  const local = localHM(r.targetSendAt, 'America/Chicago')
  assertEquals(local.hour, 8)
  assertEquals(local.minute, 0)
  assertEquals(local.day, 15) // same day
})

Deno.test('Toll-free (800) → invalid with reason=toll-free', () => {
  const r = decideDispatch('18005551234', 'appointment-reminder', utcInstant(12, 0, CST))
  assertEquals(r.kind, 'invalid')
  if (r.kind !== 'invalid') return
  assertEquals(r.reason, 'toll-free')
})

Deno.test('Unknown type + FL + in-window → send-now (gate engages but window allows)', () => {
  const now = utcInstant(15, 0, EST)
  const r = decideDispatch('13055551234', 'random-marketing-blast', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('Unknown type + FL + off-window → queue (fail-closed)', () => {
  const now = utcInstant(22, 0, EST)
  const r = decideDispatch('13055551234', 'random-marketing-blast', now)
  assertEquals(r.kind, 'queue')
})

Deno.test('Boundary: 20:00:00 ET → quiet (queue) — window is [08:00, 20:00)', () => {
  const now = utcInstant(20, 0, EST)
  const r = decideDispatch('13055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'queue')
})

Deno.test('Boundary: 08:00:00 ET → in window (send-now)', () => {
  const now = utcInstant(8, 0, EST)
  const r = decideDispatch('13055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('Boundary: 19:59:00 ET → in window (send-now)', () => {
  const now = utcInstant(19, 59, EST)
  const r = decideDispatch('13055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'send-now')
})

Deno.test('Boundary: 07:59:00 ET → quiet (queue)', () => {
  const now = utcInstant(7, 59, EST)
  const r = decideDispatch('13055551234', 'appointment-reminder', now)
  assertEquals(r.kind, 'queue')
})

Deno.test('phone classification: 10-digit input gets normalized', () => {
  const r = decideDispatch('3055551234', 'appointment-reminder', utcInstant(15, 0, EST))
  assert(r.kind === 'send-now')
  assertEquals(r.phone, '13055551234')
})
