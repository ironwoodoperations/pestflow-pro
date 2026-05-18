// Shared DataForSEO Labs client — S227.
// Result-shaped ({ data, error }); no throws into the caller. Each call wraps
// fetch with a 10s AbortController (validator gate Q2/Q3). HTTP Basic Auth via
// Deno-native btoa. Fresh fetch per call (short-lived edge fn — no pooling).
//
// MUST be included in the same files[] array as the consuming edge fn on
// deploy_edge_function (memory: missing _shared dep = silent deploy/runtime fail).

const DFS_BASE = 'https://api.dataforseo.com/v3'
const DFS_TIMEOUT_MS = 10_000

export type DFSResult<T = unknown> = {
  data: T | null
  error: { code: string; message: string } | null
}

async function dfsPost(
  path: string,
  authB64: string,
  payload: Record<string, unknown>,
): Promise<DFSResult<unknown[]>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DFS_TIMEOUT_MS)
  try {
    const res = await fetch(`${DFS_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authB64}`,
        'Content-Type': 'application/json',
      },
      // DataForSEO Live endpoints take an array of task objects.
      body: JSON.stringify([payload]),
      signal: controller.signal,
    })
    const body = await res.json().catch(() => null) as {
      status_code?: number
      status_message?: string
      tasks?: Array<{ status_code?: number; status_message?: string; result?: unknown[] }>
    } | null

    if (!res.ok) {
      return { data: null, error: { code: String(res.status), message: `DataForSEO HTTP ${res.status}` } }
    }
    // DFS convention: HTTP 200 with status_code != 20000 is a logical error.
    if (!body || body.status_code !== 20000) {
      return {
        data: null,
        error: {
          code: String(body?.status_code ?? 'unknown'),
          message: body?.status_message ?? 'DataForSEO returned no body',
        },
      }
    }
    const task = body.tasks?.[0]
    if (!task || task.status_code !== 20000) {
      return {
        data: null,
        error: {
          code: String(task?.status_code ?? 'unknown'),
          message: task?.status_message ?? 'DataForSEO task error',
        },
      }
    }
    return { data: task.result ?? [], error: null }
  } catch (e) {
    const isAbort = (e as Error).name === 'AbortError'
    return {
      data: null,
      error: {
        code: isAbort ? 'timeout' : 'fetch_error',
        message: isAbort ? `DataForSEO request timed out (${DFS_TIMEOUT_MS / 1000}s)` : (e as Error).message,
      },
    }
  } finally {
    clearTimeout(timer)
  }
}

export type DFSClient = ReturnType<typeof createDFSClient>

export function createDFSClient({ login, password }: { login: string; password: string }) {
  const authB64 = btoa(`${login}:${password}`)
  const LOC = 'United States'
  const LANG = 'English'
  return {
    rankedKeywords: (a: { target: string; location_name?: string; limit?: number }) =>
      dfsPost('/dataforseo_labs/google/ranked_keywords/live', authB64, {
        target: a.target, location_name: a.location_name ?? LOC, language_name: LANG, limit: a.limit ?? 20,
      }),
    competitorsDomain: (a: { target: string; location_name?: string; limit?: number }) =>
      dfsPost('/dataforseo_labs/google/competitors_domain/live', authB64, {
        target: a.target, location_name: a.location_name ?? LOC, language_name: LANG, limit: a.limit ?? 3,
      }),
    domainIntersection: (a: { target1: string; target2: string; location_name?: string; limit?: number }) =>
      dfsPost('/dataforseo_labs/google/domain_intersection/live', authB64, {
        target1: a.target1, target2: a.target2, location_name: a.location_name ?? LOC,
        language_name: LANG, limit: a.limit ?? 10, intersections: false,
      }),
    keywordSuggestions: (a: { keyword: string; location_name?: string; limit?: number }) =>
      dfsPost('/dataforseo_labs/google/keyword_suggestions/live', authB64, {
        keyword: a.keyword, location_name: a.location_name ?? LOC, language_name: LANG, limit: a.limit ?? 20,
      }),
  }
}
