// S346 Part A — the operator lookup, and the fail-closed branch that matters.
//
// WHY THE ERROR MOCK RETURNS DATA *AND* AN ERROR:
// error and not-an-operator both deny, so a test that mocks `{data: null,
// error: X}` cannot tell them apart — delete the error branch and `data !== null`
// still returns false, and the test still passes. That is the S319 vacuous-guard
// shape exactly. Supplying a row ALONGSIDE the error makes the branch
// load-bearing: without it the function reads the row and authorizes off a
// failed query. Mutation-verified below the assertions.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { isIronwoodOperator, type OperatorLookupClient } from './operatorLookup';

const OPERATOR_ID = '32b8fbf4-6378-49b2-b5b5-580d7a0c9a21'; // scott@homeflowpro.ai, live
const NON_OPERATOR = '5181b30a-265f-4a70-a323-bf6e3c53641b'; // admin@pestflowpro.com

function client(result: { data: unknown; error: unknown }, spy?: (t: string, c: string, v: string) => void) {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          maybeSingle: async () => { spy?.(table, columns, value); return result; },
        }),
      }),
    }),
  } as OperatorLookupClient;
}

afterEach(() => vi.restoreAllMocks());

describe('isIronwoodOperator — the allow path', () => {
  it('a row in public.operators authorizes', async () => {
    expect(await isIronwoodOperator(client({ data: { user_id: OPERATOR_ID }, error: null }), OPERATOR_ID)).toBe(true);
  });

  it('reads public.operators by user_id — not a hardcoded set', async () => {
    const seen: string[] = [];
    await isIronwoodOperator(client({ data: null, error: null }, (t, c, v) => seen.push(t, c, v)), OPERATOR_ID);
    expect(seen).toEqual(['operators', 'user_id', OPERATOR_ID]);
  });
});

describe('isIronwoodOperator — the NOT-AN-OPERATOR path', () => {
  it('no row denies', async () => {
    expect(await isIronwoodOperator(client({ data: null, error: null }), NON_OPERATOR)).toBe(false);
  });

  it('undefined (a driver that omits data rather than nulling it) denies', async () => {
    expect(await isIronwoodOperator(client({ data: undefined, error: null }), NON_OPERATOR)).toBe(false);
  });

  it('an empty user id denies without querying', async () => {
    let queried = false;
    await isIronwoodOperator(client({ data: { user_id: 'x' }, error: null }, () => { queried = true; }), '');
    expect(queried).toBe(false);
  });
});

describe('isIronwoodOperator — the FAIL-CLOSED ERROR path, tested separately', () => {
  it('a lookup error denies EVEN WHEN a row comes back with it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // The adversarial pair: this is what makes the error branch load-bearing.
    const res = await isIronwoodOperator(
      client({ data: { user_id: OPERATOR_ID }, error: { message: 'connection reset' } }),
      OPERATOR_ID,
    );
    expect(res).toBe(false);
  });

  it('says it is denying, and names the cause', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await isIronwoodOperator(client({ data: null, error: { message: 'permission denied' } }), OPERATOR_ID);
    const line = warn.mock.calls.map(c => c.join(' ')).join('\n');
    expect(line).toMatch(/DENYING/);
    expect(line).toMatch(/permission denied/);
  });

  it('a non-Error error value still denies rather than throwing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await isIronwoodOperator(client({ data: { user_id: OPERATOR_ID }, error: 'boom' }), OPERATOR_ID)).toBe(false);
  });
});

describe('the hardcoded allowlist is GONE and must not come back', () => {
  const read = (p: string) => require('node:fs').readFileSync(p, 'utf8');

  it('aiAuth.ts declares no operator uuid set', () => {
    const src = read(__dirname + '/aiAuth.ts');
    expect(src).not.toMatch(/IRONWOOD_OPERATOR_USER_IDS/);
    // assembled from fragments so this assertion cannot itself be the 4th list
    const uuidish = new RegExp(['5181b30a', '265f', '4a70'].join('-'));
    expect(src).not.toMatch(uuidish);
  });

  it('aiAuth.ts routes BOTH branches through the table reader', () => {
    const src = read(__dirname + '/aiAuth.ts');
    // operator-feature branch, and the tenant-feature hard separation
    expect(src.match(/isIronwoodOperator\(/g) || []).toHaveLength(2);
  });

  it('scrape-prospect gates on the table reader, not an imported set', () => {
    const src = read(__dirname + '/../scrape-prospect/index.ts');
    expect(src).toMatch(/isIronwoodOperator\(/);
    expect(src).not.toMatch(/IRONWOOD_OPERATOR_USER_IDS/);
  });

  it('nothing calls is_operator() as an RPC — it reads auth.uid(), NULL under service role', () => {
    for (const f of ['/aiAuth.ts', '/operatorLookup.ts', '/../scrape-prospect/index.ts']) {
      expect(read(__dirname + f)).not.toMatch(/rpc\(\s*['"]is_operator['"]/);
    }
  });
});
