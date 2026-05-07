// NANPA area-code → state/timezone classification.
//
// Data source: NANPA published NPA list (https://nationalnanpa.com/).
// Snapshot date: 2026-05-07. Annual review cadence — re-check at year boundary
// for any new NPAs assigned by NANPA over the prior 12 months.
//
// State assignment uses each NPA's dominant geographic state. NPAs that span
// multiple time zones inside the same state (e.g., FL 850 panhandle = CT vs.
// rest of FL = ET) are resolved at the NPA level via NPA_TIMEZONES, which
// takes precedence over STATE_TIMEZONES.
//
// Toll-free NPAs (800/833/844/855/866/877/888) and non-geographic NPAs
// (500/521-533/600/700/710) do NOT classify as us-geographic and cannot be
// gated by quiet-hours rules — caller must reject or whitelist them.

export type USState =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'DC' | 'FL'
  | 'GA' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME'
  | 'MD' | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH'
  | 'NJ' | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'PR'
  | 'RI' | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV'
  | 'WI' | 'WY';

export type IANAZone =
  | 'America/New_York'
  | 'America/Chicago'
  | 'America/Denver'
  | 'America/Phoenix'        // AZ — no DST
  | 'America/Los_Angeles'
  | 'America/Anchorage'      // AK
  | 'Pacific/Honolulu'       // HI — no DST
  | 'America/Puerto_Rico'    // PR — no DST, AST
  | 'America/Indiana/Indianapolis'
  | 'America/Detroit'
  | 'America/Boise';

const STATE_TIMEZONES: Record<USState, IANAZone> = {
  AL: 'America/Chicago',     AK: 'America/Anchorage',   AZ: 'America/Phoenix',
  AR: 'America/Chicago',     CA: 'America/Los_Angeles', CO: 'America/Denver',
  CT: 'America/New_York',    DE: 'America/New_York',    DC: 'America/New_York',
  FL: 'America/New_York',    GA: 'America/New_York',    HI: 'Pacific/Honolulu',
  ID: 'America/Boise',       IL: 'America/Chicago',     IN: 'America/Indiana/Indianapolis',
  IA: 'America/Chicago',     KS: 'America/Chicago',     KY: 'America/New_York',
  LA: 'America/Chicago',     ME: 'America/New_York',    MD: 'America/New_York',
  MA: 'America/New_York',    MI: 'America/Detroit',     MN: 'America/Chicago',
  MS: 'America/Chicago',     MO: 'America/Chicago',     MT: 'America/Denver',
  NE: 'America/Chicago',     NV: 'America/Los_Angeles', NH: 'America/New_York',
  NJ: 'America/New_York',    NM: 'America/Denver',      NY: 'America/New_York',
  NC: 'America/New_York',    ND: 'America/Chicago',     OH: 'America/New_York',
  OK: 'America/Chicago',     OR: 'America/Los_Angeles', PA: 'America/New_York',
  PR: 'America/Puerto_Rico', RI: 'America/New_York',    SC: 'America/New_York',
  SD: 'America/Chicago',     TN: 'America/Chicago',     TX: 'America/Chicago',
  UT: 'America/Denver',      VT: 'America/New_York',    VA: 'America/New_York',
  WA: 'America/Los_Angeles', WV: 'America/New_York',    WI: 'America/Chicago',
  WY: 'America/Denver',
};

// NPAs whose timezone differs from their dominant state's timezone.
// Resolution at NPA level takes precedence over state-level lookup.
const NPA_TIMEZONES: Record<string, IANAZone> = {
  // FL panhandle — Central Time
  '850': 'America/Chicago',
  // KS — most of KS is CT; western counties (NPA 620 partial) are MT, but 620 is mostly CT — leave as state default
  // ND/SD/NE — split states; keep state-level (CT) — narrow refinements deferred until a tenant lands there
  // TX panhandle (915 El Paso = MT)
  '915': 'America/Denver',
  // OR/ID — most of OR is PT; eastern OR is MT, but no NPA splits cleanly. Keep state default.
  // KY — eastern KY is ET (state default), western KY is CT. NPAs 270/364 are western (CT).
  '270': 'America/Chicago',
  '364': 'America/Chicago',
  // TN — eastern TN (NPAs 423, 865) is ET; rest is CT (state default).
  '423': 'America/New_York',
  '865': 'America/New_York',
  // IN — most counties are ET via Indiana/Indianapolis (state default); a few western counties are CT. NPAs don't cleanly split — leave at state default.
  // FL — Pensacola NPA 850 covered above. Rest is ET (state default).
};

// NPA → state. Source: NANPA, dominant geographic assignment.
// Toll-free, non-geographic, and Caribbean-non-PR NPAs are intentionally absent.
export const AREA_CODE_TO_STATE: Record<string, USState> = {
  // Alabama
  '205': 'AL', '251': 'AL', '256': 'AL', '334': 'AL', '659': 'AL', '938': 'AL',
  // Alaska
  '907': 'AK',
  // Arizona
  '480': 'AZ', '520': 'AZ', '602': 'AZ', '623': 'AZ', '928': 'AZ',
  // Arkansas
  '479': 'AR', '501': 'AR', '870': 'AR', '327': 'AR',
  // California
  '209': 'CA', '213': 'CA', '279': 'CA', '310': 'CA', '323': 'CA', '341': 'CA',
  '350': 'CA', '369': 'CA', '408': 'CA', '415': 'CA', '424': 'CA', '442': 'CA',
  '510': 'CA', '530': 'CA', '559': 'CA', '562': 'CA', '619': 'CA', '626': 'CA',
  '628': 'CA', '650': 'CA', '657': 'CA', '661': 'CA', '669': 'CA', '707': 'CA',
  '714': 'CA', '747': 'CA',
  '760': 'CA', '805': 'CA', '818': 'CA', '820': 'CA', '831': 'CA', '837': 'CA',
  '840': 'CA', '858': 'CA', '909': 'CA', '916': 'CA', '925': 'CA', '949': 'CA',
  '951': 'CA',
  // Colorado
  '303': 'CO', '719': 'CO', '720': 'CO', '970': 'CO', '983': 'CO',
  // Connecticut
  '203': 'CT', '475': 'CT', '860': 'CT', '959': 'CT',
  // Delaware
  '302': 'DE',
  // DC
  '202': 'DC',
  // Florida
  '239': 'FL', '305': 'FL', '321': 'FL', '352': 'FL', '386': 'FL', '407': 'FL',
  '561': 'FL', '656': 'FL', '689': 'FL', '727': 'FL', '754': 'FL', '772': 'FL',
  '786': 'FL', '813': 'FL', '850': 'FL', '863': 'FL', '904': 'FL', '941': 'FL',
  '954': 'FL', '645': 'FL', '728': 'FL',
  // Georgia
  '229': 'GA', '404': 'GA', '470': 'GA', '478': 'GA', '678': 'GA', '706': 'GA',
  '762': 'GA', '770': 'GA', '912': 'GA', '943': 'GA',
  // Hawaii
  '808': 'HI',
  // Idaho
  '208': 'ID', '986': 'ID',
  // Illinois
  '217': 'IL', '224': 'IL', '309': 'IL', '312': 'IL', '331': 'IL', '447': 'IL',
  '464': 'IL', '618': 'IL', '630': 'IL', '708': 'IL', '730': 'IL', '773': 'IL',
  '779': 'IL', '815': 'IL', '847': 'IL', '861': 'IL', '872': 'IL',
  // Indiana
  '219': 'IN', '260': 'IN', '317': 'IN', '463': 'IN', '574': 'IN', '765': 'IN',
  '812': 'IN', '930': 'IN',
  // Iowa
  '319': 'IA', '515': 'IA', '563': 'IA', '641': 'IA', '712': 'IA',
  // Kansas
  '316': 'KS', '620': 'KS', '785': 'KS', '913': 'KS',
  // Kentucky
  '270': 'KY', '364': 'KY', '502': 'KY', '606': 'KY', '859': 'KY',
  // Louisiana
  '225': 'LA', '318': 'LA', '337': 'LA', '504': 'LA', '985': 'LA',
  // Maine
  '207': 'ME',
  // Maryland
  '227': 'MD', '240': 'MD', '301': 'MD', '410': 'MD', '443': 'MD', '667': 'MD',
  // Massachusetts
  '339': 'MA', '351': 'MA', '413': 'MA', '508': 'MA', '617': 'MA', '774': 'MA',
  '781': 'MA', '857': 'MA', '978': 'MA',
  // Michigan
  '231': 'MI', '248': 'MI', '269': 'MI', '313': 'MI', '517': 'MI', '586': 'MI',
  '616': 'MI', '679': 'MI', '734': 'MI', '810': 'MI', '906': 'MI', '947': 'MI',
  '989': 'MI',
  // Minnesota
  '218': 'MN', '320': 'MN', '507': 'MN', '612': 'MN', '651': 'MN', '763': 'MN',
  '952': 'MN',
  // Mississippi
  '228': 'MS', '601': 'MS', '662': 'MS', '769': 'MS',
  // Missouri
  '314': 'MO', '417': 'MO', '557': 'MO', '573': 'MO', '636': 'MO', '660': 'MO',
  '816': 'MO', '975': 'MO',
  // Montana
  '406': 'MT',
  // Nebraska
  '308': 'NE', '402': 'NE', '531': 'NE',
  // Nevada
  '702': 'NV', '725': 'NV', '775': 'NV',
  // New Hampshire
  '603': 'NH',
  // New Jersey
  '201': 'NJ', '551': 'NJ', '609': 'NJ', '640': 'NJ', '732': 'NJ', '848': 'NJ',
  '856': 'NJ', '862': 'NJ', '908': 'NJ', '973': 'NJ',
  // New Mexico
  '505': 'NM', '575': 'NM',
  // New York
  '212': 'NY', '315': 'NY', '329': 'NY', '332': 'NY', '347': 'NY', '363': 'NY',
  '516': 'NY', '518': 'NY', '585': 'NY', '607': 'NY', '631': 'NY', '646': 'NY',
  '680': 'NY', '716': 'NY', '718': 'NY', '838': 'NY', '845': 'NY', '914': 'NY',
  '917': 'NY', '929': 'NY', '934': 'NY',
  // North Carolina
  '252': 'NC', '336': 'NC', '472': 'NC', '704': 'NC', '743': 'NC', '828': 'NC',
  '910': 'NC', '919': 'NC', '980': 'NC', '984': 'NC',
  // North Dakota
  '701': 'ND',
  // Ohio
  '216': 'OH', '220': 'OH', '234': 'OH', '283': 'OH', '326': 'OH', '330': 'OH',
  '380': 'OH', '419': 'OH', '436': 'OH', '440': 'OH', '513': 'OH', '567': 'OH',
  '614': 'OH', '740': 'OH', '937': 'OH',
  // Oklahoma
  '405': 'OK', '539': 'OK', '572': 'OK', '580': 'OK', '918': 'OK',
  // Oregon
  '458': 'OR', '503': 'OR', '541': 'OR', '971': 'OR',
  // Pennsylvania
  '215': 'PA', '223': 'PA', '267': 'PA', '272': 'PA', '412': 'PA', '445': 'PA',
  '484': 'PA', '570': 'PA', '582': 'PA', '610': 'PA', '717': 'PA', '724': 'PA',
  '814': 'PA', '835': 'PA', '878': 'PA',
  // Puerto Rico
  '787': 'PR', '939': 'PR',
  // Rhode Island
  '401': 'RI',
  // South Carolina
  '803': 'SC', '821': 'SC', '839': 'SC', '843': 'SC', '854': 'SC', '864': 'SC',
  // South Dakota
  '605': 'SD',
  // Tennessee
  '423': 'TN', '615': 'TN', '629': 'TN', '731': 'TN', '865': 'TN', '901': 'TN',
  '931': 'TN',
  // Texas (overrides 737 = TX, not CA)
  '210': 'TX', '214': 'TX', '254': 'TX', '281': 'TX', '325': 'TX', '346': 'TX',
  '361': 'TX', '409': 'TX', '430': 'TX', '432': 'TX', '469': 'TX', '512': 'TX',
  '682': 'TX', '713': 'TX', '726': 'TX', '737': 'TX', '806': 'TX', '817': 'TX',
  '830': 'TX', '832': 'TX', '903': 'TX', '915': 'TX', '936': 'TX', '940': 'TX',
  '945': 'TX', '956': 'TX', '972': 'TX', '979': 'TX',
  // Utah
  '385': 'UT', '435': 'UT', '801': 'UT',
  // Vermont
  '802': 'VT',
  // Virginia
  '276': 'VA', '434': 'VA', '540': 'VA', '571': 'VA', '703': 'VA', '757': 'VA',
  '804': 'VA', '826': 'VA', '948': 'VA',
  // Washington
  '206': 'WA', '253': 'WA', '360': 'WA', '425': 'WA', '509': 'WA', '564': 'WA',
  // West Virginia
  '304': 'WV', '681': 'WV',
  // Wisconsin
  '262': 'WI', '274': 'WI', '353': 'WI', '414': 'WI', '534': 'WI', '608': 'WI',
  '715': 'WI', '920': 'WI',
  // Wyoming
  '307': 'WY',
};

const TOLL_FREE_NPAS = new Set(['800', '833', '844', '855', '866', '877', '888']);
const NON_GEOGRAPHIC_NPAS = new Set([
  '500', '521', '522', '523', '524', '525', '526', '527', '528', '529',
  '530', '531', '532', '533', '600', '700', '710',
]);

export type ClassifyResult =
  | { kind: 'us-geographic'; npa: string; state: USState; timezone: IANAZone }
  | { kind: 'toll-free'; npa: string }
  | { kind: 'non-geographic'; npa: string }
  | { kind: 'invalid' };

/**
 * Classify a phone number into a routing decision.
 * Accepts E.164-ish ('+15551234567'), US-leading-1 ('15551234567'), or 10-digit ('5551234567') input.
 * Returns 'invalid' for non-NANPA numbers, malformed input, or NPAs not yet assigned by NANPA.
 */
export function classifyNumber(phone: string): ClassifyResult {
  const digits = phone.replace(/\D/g, '');
  // Strip leading 1 if 11-digit US number
  const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (normalized.length !== 10) return { kind: 'invalid' };
  const npa = normalized.slice(0, 3);
  // NPA must start with 2-9 per NANPA rules; second digit can be 0-9; third digit can be 0-9.
  if (!/^[2-9][0-9]{2}$/.test(npa)) return { kind: 'invalid' };

  if (TOLL_FREE_NPAS.has(npa)) return { kind: 'toll-free', npa };
  if (NON_GEOGRAPHIC_NPAS.has(npa)) return { kind: 'non-geographic', npa };

  const state = AREA_CODE_TO_STATE[npa];
  if (!state) return { kind: 'invalid' };

  // NPA-level timezone wins; fall back to state default.
  const timezone = NPA_TIMEZONES[npa] ?? STATE_TIMEZONES[state];
  return { kind: 'us-geographic', npa, state, timezone };
}
