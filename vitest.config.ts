import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// S284 — vitest's own config, so that `npx vitest run` exits 0 on a healthy tree
// both in CI and on a developer's machine.
//
// WHY THIS FILE EXISTS AND NOT A `test` BLOCK IN vite.config.ts:
// `npm run build` runs `vite build`, so vite.config.ts is loaded during a
// production build. Typing a `test` block there correctly means importing
// `defineConfig` from 'vitest/config' — pulling a devDependency into the
// production build's module graph, which fails wherever devDependencies are not
// installed. vitest.config.ts is read by vitest and by nothing else, and it
// takes precedence over vite.config.ts, so the build cannot be affected.
// tsconfig.node.json also type-checks vite.config.ts specifically; this file is
// outside that include, and outside the root tsconfig (which excludes nothing
// relevant but includes only app/, shared/ and middleware.ts).

export default defineConfig({
  // Carried over from vite.config.ts, which vitest no longer reads now that this
  // file exists. The admin tests render real components (.tsx) — without the
  // plugin their JSX transform changes.
  plugins: [react()],
  test: {
    exclude: [
      // Vitest's own defaults. Naming `exclude` REPLACES them rather than
      // appending, so dropping these would collect every test in node_modules.
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/public/_admin/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',

      // ── The eight DENO tests. ─────────────────────────────────────────────
      // These are not vitest tests and never were: they call `Deno.test` and
      // import from `https://` URLs, which Node's ESM loader rejects outright
      // ("Only URLs with a scheme in: file and data are supported"). Vitest was
      // collecting them purely because they match *.test.ts, and failing to load
      // all eight — which is why `npx vitest run` exited 1 on a tree where all
      // 535 tests pass, and why this suite could not be added to CI until now.
      //
      // They are EXCLUDED, not fixed, and not skipped-with-a-flag: nothing here
      // masks a failing assertion. `--passWithNoTests` and friends are
      // deliberately not used. supabase/functions/_shared/auth/ is run for real
      // by the `auth-isolation-test` job (`deno test … supabase/functions/_shared/auth/`)
      // against a live local Supabase stack; the seven per-function index tests
      // are run by nothing today, which is a pre-existing gap and out of scope.
      //
      // NOTE the asymmetry when adding tests under supabase/functions/:
      //   - a new DENO test outside these two globs breaks CI loudly, and the
      //     fix is to widen the list. That is the safe direction.
      //   - a new VITEST test named index.test.ts inside a function directory
      //     would be silently skipped. That is the dangerous direction — name it
      //     anything else. Four vitest tests already live under
      //     supabase/functions/ and MUST keep running: the three under
      //     _shared/aiAuthority/, and generate-monthly-report/narrationPrompt.test.ts,
      //     which asserts the S261 anti-hallucination PLATFORM_RULES block is
      //     byte-identical. Scoping vitest to src/app/shared instead would have
      //     dropped exactly those four while still reporting green.
      'supabase/functions/*/index.test.ts',
      'supabase/functions/_shared/auth/**',
    ],
  },
});
