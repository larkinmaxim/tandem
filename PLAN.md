# Phase 0 — Tandem v1.0 Scaffold

## Context

Tandem v1.0 is a new Tauri 2 + React 19 + Vite desktop app at `C:\E\Tandem_dev\ui\tandem/`, alongside `ui/goose2/`. Per `Notes/Tandem v1.0 Plan.md`, Phase 0 lays the foundation: workspace registration, scaffold, foundation copy, and a deliberately throwaway "bootstrap screen" that verifies eight architectural seams before any shell layout is built on top.

Pre-flight (in `ui/goose2/`) confirmed Node/pnpm/Vite/TypeScript/React 19/Tailwind v4/`@aaif/goose-sdk` workspace resolution all work on this Windows machine. It also surfaced that goose2's `beforeDevCommand` uses bash-only `exec ./node_modules/.bin/vite`, which doesn't run on Windows.

Plan-validation pass also surfaced two material issues:
- **i18n stack is `react-i18next`, not `react-intl`** (the Pre-Analysis was wrong). `react-i18next` is imported by **12 files we copy in Phase 0** (11 ai-elements + `features/chat/hooks/useChat.ts`). User confirmed: keep `react-i18next` + copy `shared/i18n/` (English locale only, drop `es/`); revisit removal in a later cleanup release.
- **Two extra `features/chat/` subdirs are required** for the copied stores to compile: `features/chat/lib/` (provides `DEFAULT_CHAT_TITLE`) and `features/chat/hooks/` (provides `clearReplayBuffer`). Original copy list missed both.

This phase ends with a merge-commit on `tandem/main` of the `tandem/feat/v1.0-phase-0-scaffold` branch, all 8 acceptance criteria green.

## Phase 0 acceptance criteria

1. `pnpm tauri dev` opens the Tauri window with no console errors
2. Text colored with `var(--color-accent)` renders correctly (CSS chain works)
3. A shadcn `Button` component renders with shadcn classes
4. ACP status reads "connected" within 5 seconds (frozen `shared/api/` talks to goose serve)
5. `chatSessionStore` and `providerInventoryStore` show initial states (foundation imports + Zustand work)
6. HMR fires within 2 seconds on any source edit
7. `pnpm tsc --noEmit` from `ui/tandem/` exits 0
8. `pnpm test` from `ui/tandem/` is green — the inherited goose2 tests for `chatStore`, `chatSessionStore`, and `acpNotificationHandler` pass against the copied foundation. (Replaces the original "no formatMessage" check, which became moot once we kept the i18n stack.)

## Pre-Phase-0 prerequisites (one-time, NOT committed in this branch)

These are environment setup, not Tandem code. Must succeed before criterion 4 can pass.

- **Rust toolchain** installed (`cargo`, `rustc`).
- **Goose binary built**: `cargo build -p goose-cli --release` from `C:\E\Tandem_dev\` — produces `target/release/goose.exe`. Tauri's `externalBin` resolves to this path.
- **ACP schema generated**: `cargo run -p goose --bin generate-acp-schema` from `C:\E\Tandem_dev\` — produces `crates/goose/acp-schema.json` and `acp-meta.json`.
- **`ui/sdk/` built**: already done in pre-flight; `ui/sdk/dist/` exists.

## Implementation steps

Branch: `tandem/feat/v1.0-phase-0-scaffold` off `tandem/main` (which already has `CLAUDE.md` committed).

### Step 1 — Workspace registration

- `C:\E\Tandem_dev\ui\pnpm-workspace.yaml` — append `- 'tandem'` after `- 'goose2'`.
- `C:\E\Tandem_dev\Cargo.toml` — extend the existing `exclude` array to include `"ui/tandem/src-tauri"` alongside `"ui/goose2/src-tauri"`.

### Step 2 — Scaffold Vite + React + TypeScript

- Create directory `C:\E\Tandem_dev\ui\tandem\`.
- Generate Vite/React/TS skeleton (`pnpm create vite . --template react-ts` from inside `ui/tandem/`).
- Confirm the generated `package.json` contains `"dev": "vite"` (Vite scaffold provides this; required by step 5's `beforeDevCommand: pnpm dev`).
- Delete demo content: `src/App.css`, `src/assets/`, demo body of `src/App.tsx`.

### Step 3 — Install dependencies

From `C:\E\Tandem_dev\ui\tandem\`:

- **Runtime**: `react@^19`, `react-dom@^19`, `@tauri-apps/api@^2`, `@aaif/goose-sdk@workspace:*`, `@agentclientprotocol/sdk@^0.19`, `zustand@^5`, `@tanstack/react-query`, `lucide-react`, `react-syntax-highlighter`, `shiki`, `react-i18next@^17`, `i18next@^26`, `i18next-resources-to-backend@^1`, plus the Radix primitives needed by ported leaves (`@radix-ui/react-dialog`, `react-dropdown-menu`, `react-popover`, `react-tabs`, `react-tooltip`, `react-switch`, `react-scroll-area`).
- **Dev**: `@tauri-apps/cli@^2`, `vite`, `@vitejs/plugin-react`, `typescript@~5.9`, `tailwindcss@^4`, `@tailwindcss/vite`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@types/react-syntax-highlighter`.
- shadcn auto-installs `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` in step 6 — don't pre-install.

### Step 4 — Vite config + TypeScript config

`C:\E\Tandem_dev\ui\tandem\vite.config.ts` — mirror `ui/goose2/vite.config.ts:1-30` with port `1521` (HMR `1522`) instead of `1520`/`1521`. Same `@` alias, `clearScreen: false`, `server.watch.ignored: ["**/src-tauri/**"]`, optional `TAURI_DEV_HOST` handling.

`C:\E\Tandem_dev\ui\tandem\tsconfig.json` — mirror `ui/goose2/tsconfig.json:1-23` exactly. Single `@/*` path alias.

### Step 5 — Copy and configure `src-tauri/`

Copy `ui/goose2/src-tauri/` → `ui/tandem/src-tauri/` (recursive: `Cargo.toml`, `tauri.conf.json`, `capabilities/`, `entitlements.plist`, `icons/`, `gen/schemas/`, all 13 Rust source files).

**Edit `tandem/src-tauri/tauri.conf.json` — 4 config-only changes (NOT 3 as the Scaffold Plan stated):**

1. `productName: "Goose"` → `"Tandem"`
2. `identifier: "com.goose.app"` → `"com.tandem.app"`
3. `build.devUrl: "http://localhost:1520"` → `"http://localhost:1521"`
4. **`build.beforeDevCommand`**: replace the bash-only `{ "script": "exec ./node_modules/.bin/vite", "cwd": "..", "wait": false }` with the cross-platform form:
   ```json
   "beforeDevCommand": {
     "script": "pnpm dev",
     "cwd": "..",
     "wait": false
   }
   ```
   `pnpm` is available on Windows + Unix; `cwd: ".."` keeps the explicit escape from `src-tauri/` to `ui/tandem/`; `wait: false` preserves goose2's behavior (Tauri detects readiness via `devUrl`).

Optional: change window `title: "Goose"` → `"Tandem"` for the OS title bar text on Windows.

**Edit `tandem/src-tauri/Cargo.toml`**: rename package to `tandem`, binary `[[bin]] name = "tandem-tauri"`, lib `[lib] name = "tandem_lib"`. All Rust dependencies and source files unchanged.

**Replace `tandem/src-tauri/icons/`** with Tandem-branded icons. For Phase 0 acceptance, generated PNG/ICO/ICNS from `design/project/ds/assets/logo.svg` is sufficient. If quick icon generation isn't available, leave goose icons in place and add a TODO; doesn't block any acceptance criterion.

The `externalBin: ["../../../target/release/goose"]` path is unchanged — same relative depth from `ui/tandem/src-tauri/` as from `ui/goose2/src-tauri/`. Verified: both sit at `Tandem_dev/ui/<app>/src-tauri/`, three levels deep from workspace root. Tauri auto-appends `.exe` on Windows.

### Step 6 — Initialize shadcn/ui (BEFORE writing index.css)

Step order matters: `pnpm dlx shadcn@latest init` rewrites/appends to `src/index.css`. We initialize shadcn first, then layer the design token imports on top.

- Run `pnpm dlx shadcn@latest init` in `ui/tandem/`.
- Configure `components.json` to mirror `ui/goose2/components.json:1-21`:
  - `style: "ghost"`, `baseColor: "neutral"`, `cssVariables: true`
  - `aliases.components: "@/shared/ui"`, `aliases.utils: "@/shared/lib/cn"`, `aliases.lib: "@/shared/lib"`, `aliases.ui: "@/shared/ui"`
  - `iconLibrary: "lucide"`
- Install one component for Phase 0: `pnpm dlx shadcn@latest add button`. Other components added in later phases as needed.

### Step 7 — Tailwind v4 + design tokens

After shadcn init has settled `src/index.css`, finalize the import order. Copy in design tokens:

- Copy `C:\E\Obsidian-Tandem\Tandem\design\project\ds\colors_and_type.css` → `ui/tandem/src/ds/colors_and_type.css`.
- Copy `C:\E\Obsidian-Tandem\Tandem\design\project\ds\fonts\fonts.css` → `ui/tandem/src/ds/fonts.css`.
- Edit `ui/tandem/src/index.css`. Final ordering must be:
  ```css
  @import "tailwindcss";
  /* shadcn-injected @theme / @layer blocks here, untouched */
  @import "./ds/colors_and_type.css";
  @import "./ds/fonts.css";
  ```
  Critical: Tailwind first, then shadcn's blocks, THEN the design tokens last so the design's base styles override Tailwind's preflight reset.

A `@theme` block mapping Tandem tokens to Tailwind utilities is NOT added in Phase 0 — shell components use `var(--token)` directly. The mapping can be added later if/when leaf components need Tandem tokens via Tailwind utility classes.

### Step 8 — Copy the foundation layer

Copy these directories from `ui/goose2/src/` to `ui/tandem/src/` byte-for-byte. Frozen at upstream pin `df302d74`.

**Shared modules (no modification beyond i18n locale pruning):**
- `shared/api/` — all 15 source files plus any `__tests__/` directory: `acp.ts`, `acpApi.ts`, `acpConnection.ts`, `acpNotificationHandler.ts`, `acpNotificationHandler.test.ts`, `acpSessionTracker.ts`, `agents.ts`, `createWebSocketStream.ts`, `dictation.ts`, `doctor.ts`, `git.ts`, `index.ts`, `pathResolver.ts`, `sessionSearch.ts`, `system.ts`, plus `.gitkeep`.
- `shared/types/`
- `shared/lib/`
- `shared/hooks/`
- `shared/i18n/` — **DO copy**. Copy everything EXCEPT `shared/i18n/locales/es/` (Spanish — drop to confirm English-only intent without ripping out the runtime). The 7 modules (`i18n.ts`, `I18nProvider.tsx`, `useLocale.ts`, `format.ts`, `locale.ts`, `constants.ts`, `index.ts`) and `locales/en/` (10 JSON files) come along. ai-elements files compile unchanged.
- `shared/ui/ai-elements/` — all 48 files (47 components + `prompt-input.test.tsx`). No file modifications.

**Feature stores + their transitive dependencies:**
- `features/chat/stores/` — including `__tests__/`. Imports `DEFAULT_CHAT_TITLE` from `features/chat/lib/sessionTitle` and `clearReplayBuffer` from `features/chat/hooks/replayBuffer`, so:
- `features/chat/lib/` — entire directory (provides `sessionTitle.ts` and other lib functions).
- `features/chat/hooks/` — entire directory (provides `replayBuffer.ts`). Note: `features/chat/hooks/useChat.ts` imports `useTranslation` from `react-i18next` — preserved by step 3's react-i18next install + the i18n copy above.
- `features/chat/types.ts` — used by stores.
- `features/agents/stores/`
- `features/projects/stores/`
- `features/providers/stores/`

**Do NOT copy**:
- `shared/styles/globals.css` — replaced by `colors_and_type.css`
- `shared/theme/ThemeProvider.tsx` — dark-only, no provider needed
- `shared/i18n/locales/es/` — English-only intent
- Any `features/*/ui/` — rewritten in Tandem design (Phase 1+)

**Add upstream pin comment** at the top of `ui/tandem/src/shared/api/index.ts`:
```ts
// Synced from goose2 at commit df302d74.
// Update via tandem/sync/<date> branch — see Notes/Tandem v1.0 Plan.md.
```

**No file content modifications in this step.** Earlier plans called for editing `conversation.tsx` to remove `formatMessage`; this is no longer needed because we kept the i18n stack.

### Step 9 — Write `main.tsx`

`ui/tandem/src/main.tsx` — model after `ui/goose2/src/main.tsx:1-33` but drop `ThemeProvider` (dark-only). Keep `QueryClientProvider` (some leaf components use react-query) and `I18nProvider` (preserved per step 8). Mount `<BootstrapScreen />` instead of `<App />`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BootstrapScreen } from "@/BootstrapScreen";
import { I18nProvider } from "@/shared/i18n";
import "@/index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BootstrapScreen />
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

### Step 10 — Write `BootstrapScreen.tsx`

`ui/tandem/src/BootstrapScreen.tsx` — single component, throwaway, deliberately ugly. Verifies the architectural seams visibly.

Renders a column with:

1. **Heading** "Tandem Bootstrap" using `style={{ color: 'var(--color-accent)' }}` — verifies criterion 2.
2. **shadcn `<Button>`** (imported from `@/shared/ui/button`) — verifies criterion 3.
3. **Foundation status block** — reads `useChatSessionStore.getState()` and `useProviderInventoryStore.getState()` and renders identifying counts. **Before writing**, read the actual state shapes in `ui/goose2/src/features/chat/stores/chatSessionStore.ts` and `ui/goose2/src/features/providers/stores/providerInventoryStore.ts` to use the correct state-key names (e.g. `sessions`, `providers`, `models`, etc.). Verifies criterion 5.
4. **ACP status block** — `useState<"idle" | "connecting" | "connected" | "failed" | "timeout">("connecting")`. `useEffect` on mount calls `getClient()` from `@/shared/api/acpConnection`; on resolution sets `"connected"`; on error sets `"failed"`; a 5-second timer sets `"timeout"` if neither resolves. Renders the `ws://...` URL returned by `invoke("get_goose_serve_url")`. Verifies criterion 4.

Visual style is incidental: `display: flex; flex-direction: column; gap: 16px; padding: 24px; background: var(--color-bg); color: var(--color-text);`.

### Step 11 — Verify acceptance and merge

Run from `ui/tandem/`:

1. `pnpm tsc --noEmit` — exits 0 (criterion 7).
2. `pnpm test` — Vitest runs the inherited tests; all green (criterion 8).
3. `pnpm tauri dev` — Tauri window opens, no console errors (criterion 1).
4. Visually verify in the running window: accent-colored heading (criterion 2), shadcn Button (criterion 3), ACP status reaches "connected" within 5 seconds (criterion 4), foundation block shows initial counts (criterion 5).
5. Edit `BootstrapScreen.tsx`, save, observe HMR within 2 seconds (criterion 6).

If any criterion fails: diagnose and fix before merging.

PR steps:

1. `git push -u origin tandem/feat/v1.0-phase-0-scaffold`
2. `gh pr create --base tandem/main --title "[v1.0 Phase 0] Tandem scaffold + bootstrap screen"` with body listing all 8 criteria as a checklist, each ticked, plus a note about the 4-config-change correction and the i18n preserve decision.
3. Self-review the diff.
4. Merge with **merge-commit**, NOT squash. Push `tandem/main`.

## Files created or modified

**Modified (existing files)**
- `C:\E\Tandem_dev\ui\pnpm-workspace.yaml` — append `- 'tandem'`
- `C:\E\Tandem_dev\Cargo.toml` — append `"ui/tandem/src-tauri"` to exclude array

**Created (new files in `ui/tandem/`)**
- Project scaffold: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `components.json`, `.gitignore`
- `src/index.css`, `src/main.tsx`, `src/BootstrapScreen.tsx`
- `src/ds/colors_and_type.css`, `src/ds/fonts.css`
- `src/shared/ui/button.tsx` (via shadcn add) + `src/shared/lib/cn.ts` + `src/shared/lib/utils.ts`
- `src/shared/api/*` (15 source files + tests + pin comment in index.ts)
- `src/shared/types/*`, `src/shared/lib/*` (merged with shadcn-added utils), `src/shared/hooks/*` (copied)
- `src/shared/i18n/*` (excluding `locales/es/`)
- `src/shared/ui/ai-elements/*` (48 files, no modifications)
- `src/features/chat/{lib,hooks,stores}/*` (copied with their `__tests__/`)
- `src/features/chat/types.ts`
- `src/features/{agents,projects,providers}/stores/*` (copied with their `__tests__/`)
- `src-tauri/*` (full copy of goose2/src-tauri with 4 config edits + Cargo names + icons)

## Critical reference files

- `C:\E\Tandem_dev\ui\goose2\src-tauri\tauri.conf.json` (source for the copy and the 4-line diff)
- `C:\E\Tandem_dev\ui\goose2\vite.config.ts` (template for tandem's vite.config.ts, port 1521)
- `C:\E\Tandem_dev\ui\goose2\tsconfig.json` (mirror exactly)
- `C:\E\Tandem_dev\ui\goose2\src\main.tsx` (template, minus ThemeProvider)
- `C:\E\Tandem_dev\ui\goose2\src\shared\api\acpConnection.ts` (the `getClient()` and `get_goose_serve_url` we call from BootstrapScreen)
- `C:\E\Tandem_dev\ui\goose2\src\features\chat\stores\chatSessionStore.ts` (read state shape before writing BootstrapScreen)
- `C:\E\Tandem_dev\ui\goose2\src\features\providers\stores\providerInventoryStore.ts` (read state shape before writing BootstrapScreen)
- `C:\E\Tandem_dev\ui\goose2\components.json` (shadcn config to mirror)
- `C:\E\Obsidian-Tandem\Tandem\design\project\ds\colors_and_type.css` (the design tokens)

## Reused functions / utilities

- `getClient()` from `ui/tandem/src/shared/api/acpConnection.ts` (copied from goose2). BootstrapScreen calls this to verify ACP connectivity.
- `invoke("get_goose_serve_url")` from `@tauri-apps/api/core` — Tauri command returning the WebSocket URL. Already wired into the copied `acpConnection.ts`.
- Zustand store getters (`useChatSessionStore.getState()`, `useProviderInventoryStore.getState()`) — direct reads from BootstrapScreen.

## Verification (end-to-end)

After step 11, the running Tandem app shows a deliberately ugly bootstrap screen with:
- Accent-colored "Tandem Bootstrap" heading (CSS chain: Vite → Tailwind → shadcn @theme → colors_and_type.css → CSS custom property)
- A shadcn Button (Tailwind v4 + shadcn install + alias resolution)
- "chatSessionStore: N sessions / providerInventoryStore: M providers" with real values (foundation imports + Zustand)
- "ACP: connected" plus a `ws://...` URL (frozen `shared/api/` + Tauri command + goose serve sidecar)
- Editing `BootstrapScreen.tsx` and saving updates the running window within 2 seconds (Vite HMR + Tauri integration)
- `pnpm tsc --noEmit` from `ui/tandem/` exits 0 (TypeScript types resolve across copied foundation including i18n stack)
- `pnpm test` from `ui/tandem/` runs the inherited goose2 tests, all green (Vitest installed; copied tests work)

After PR merge to `tandem/main`, the branch sits at the documented `phase-0` state. Phase 1 branches off this commit.

## Out of scope for this Phase 0

- Any `<AppShell>`, `<Ribbon>`, `<TabBar>`, `<StatusBar>`, etc. — Phase 1 work
- Any chat-specific feature code — Phase 3 work
- Restyling any AI element renderers (Phase 3 work; Phase 0 just copies them)
- New tests (the inherited tests run as-is per criterion 8; new tests start in Phase 1)
- `recipesApi.ts` (v1.3 work)
- GitHub Actions CI (post-v1.0)
- Production icons or branding polish (v1.4)
- Removing the `react-i18next` runtime (deferred to a later cleanup release; v1.0 keeps it with English-only locale)
