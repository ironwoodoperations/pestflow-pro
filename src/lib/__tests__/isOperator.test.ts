// S346C Part A — the one frontend operator check, and the branch that denies.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { isOperator, type OperatorRpcClient } from '../isOperator';

function client(result: { data: unknown; error: unknown }, spy?: (fn: string) => void): OperatorRpcClient {
  return { rpc: async (fn: string) => { spy?.(fn); return result; } };
}

afterEach(() => vi.restoreAllMocks());

describe('isOperator — allow', () => {
  it('true authorizes', async () => {
    expect(await isOperator(client({ data: true, error: null }))).toBe(true);
  });
  it('calls the is_operator RPC — not a select against the table', async () => {
    const seen: string[] = [];
    await isOperator(client({ data: true, error: null }, fn => seen.push(fn)));
    expect(seen).toEqual(['is_operator']);
  });
});

describe('isOperator — NOT an operator (distinct from the error path)', () => {
  it('false denies', async () => {
    expect(await isOperator(client({ data: false, error: null }))).toBe(false);
  });
  it('null denies', async () => {
    expect(await isOperator(client({ data: null, error: null }))).toBe(false);
  });
  it('ONLY boolean true authorizes — no truthy coercion', async () => {
    for (const v of ['true', 1, {}, [], 'yes']) {
      expect(await isOperator(client({ data: v, error: null })), String(v)).toBe(false);
    }
  });
});

describe('isOperator — FAIL CLOSED, tested separately from the above', () => {
  it('an error denies EVEN WHEN a true comes back alongside it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // The adversarial pair. Without the error branch the code authorizes off a
    // failed query; with {data:null,error:X} the two paths are indistinguishable
    // and the mutation survives. This is the shape S346 landed on.
    expect(await isOperator(client({ data: true, error: { message: 'boom' } }))).toBe(false);
  });

  it('says it is denying, and names the cause', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await isOperator(client({ data: true, error: { message: 'JWT expired' } }));
    const line = warn.mock.calls.map(c => c.join(' ')).join('\n');
    expect(line).toMatch(/DENYING/);
    expect(line).toMatch(/JWT expired/);
  });

  it('a THROWN error denies rather than propagating', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const throwing: OperatorRpcClient = { rpc: async () => { throw new Error('network down'); } };
    await expect(isOperator(throwing)).resolves.toBe(false);
  });
});
