# Tandem — Claude Code Context

## Long-term memory & knowledge base

`C:\E\Obsidian-Tandem\Tandem` (also reachable as `E:\Obsidian-Tandem\Tandem`) is the knowledge base and long-term memory for this project. It is loaded at every session start.

**Read the knowledge index when starting work:**
`C:\E\Obsidian-Tandem\Tandem\knowledge\index.md`

**The four planning documents live in the vault `Notes/` folder:**
- `Notes/Tandem PRD.md` — what we're building, user stories, scope
- `Notes/Tandem Fork Pre-Analysis.md` — codebase analysis and architectural reasoning
- `Notes/Tandem Scaffold Plan.md` — step-by-step setup guide for `ui/tandem`
- `Notes/Tandem v1.0 Plan.md` — current release plan, all v1.0 decisions, phase sequence, acceptance gates

Always read `Notes/Tandem v1.0 Plan.md` before starting v1.0 work — it is the live decisions document.

---

## What Tandem is

A fork of the goose repo (`github.com/larkinmaxim/tandem`). Tandem is a new desktop UI built on top of goose's backend — same features as goose2, same wire protocol, new visual design.

### Hard constraints (non-negotiable)

1. **Functional parity** — Tandem has the same features as goose2 UI. Nothing dropped.
2. **Wire-compatible** — communicates with `goose serve` identically to goose2. Same ACP WebSocket protocol, same Tauri commands, same HTTP API. Zero changes to the communication layer.
3. **Design fidelity** — visual implementation uses ONLY the Tandem design bundle as reference. No styles, colors, typography, layouts, or patterns from any other source. If something is ambiguous or missing from the design, ask — do not fall back on defaults.

---

## Repo structure

```
C:\E\Tandem_dev\          (github.com/larkinmaxim/tandem)
├── ui/
│   ├── goose2/           ← upstream reference — DO NOT MODIFY
│   ├── tandem/           ← the Tandem UI (new clean directory)
│   │   ├── src/
│   │   └── src-tauri/    ← copy of goose2/src-tauri, config-adapted
│   ├── sdk/              ← @aaif/goose-sdk (shared, both apps depend on it)
│   ├── desktop/          ← not our concern
│   └── text/             ← not our concern
├── crates/               ← Rust backend — not our concern
└── ...
```

---

## Branching strategy

- `main` — upstream goose, never touched
- `tandem/main` — long-lived integration branch
- `tandem/feat/v<MAJOR.MINOR>-phase-<N>-<name>` — short-lived per-phase branches off `tandem/main`
- `tandem/sync/<date>` — branches that pull upstream changes into the frozen zones (post-v1.0)

**PR workflow:** open a `tandem/feat/*` branch, work on it, open PR against `tandem/main`, self-review the diff, merge with a **merge-commit** (not squash) so phase commit history is preserved for `git bisect`. Push `tandem/main` after each merge. Tag at release boundaries (`tandem/v1.0`, `tandem/v1.1`, …).

---

## Design reference

**Location:** `C:\E\Obsidian-Tandem\Tandem\design\`

| File | Purpose |
|---|---|
| `design/project/ds/colors_and_type.css` | ALL design tokens — single source of truth |
| `design/project/app.css` | Component and layout styles |
| `design/project/Tandem Workspace.html` | Primary prototype — read fully before implementing anything |
| `design/project/Chat.jsx` | Chat section prototype |
| `design/project/Sidebar.jsx` | Ribbon + Left panel prototype |
| `design/project/RightPanel.jsx` | Right panel prototype |
| `design/project/ds/assets/logo.svg` | Tandem logo |

### Key design tokens
- Window bg `#16171b` · Canvas `#1a1b1f` · Surface `#202126` · Raised `#2a2b31`
- Accent `#8b7cff` (violet-indigo)
- Fonts: Inter (UI) · Lora (reading/messages) · JetBrains Mono (code)
- Layout: ribbon 44px · tabbar 36px · statusbar 24px · left pane 280px · right pane 320px

### Icon rule

**`lucide-react` everywhere.** No emoji icons anywhere in the UI. Applies to ribbon app slots, section switcher, left panel controls, tab bar, status bar, inline UI.

### Navigation architecture

The design has **two** navigation levels — they are not the same thing:

- **Ribbon** (44px left rail) = **app switcher**. Chat is the only live app; Email / Calendar / Projects / Editor are slots that show a "coming soon" toast on click. Plugins and Settings buttons sit at the bottom of the rail.
- **Section switcher** (inside the left panel, below the search bar) = **5 sections within the Chat app**: Chat / Projects / Memory / Workflows / Skills. All renders within the Chat app context.

---

## Architecture: frozen zones

Files copied into `ui/tandem/` and not modified:

### `ui/tandem/src/shared/api/` — ACP wiring layer
Copied from `ui/goose2/src/shared/api/`. Includes `acp.ts`, `acpConnection.ts`, `acpApi.ts`, `acpNotificationHandler.ts`, `acpSessionTracker.ts`, `createWebSocketStream.ts`, `system.ts`, `git.ts`, `agents.ts`, `pathResolver.ts`, `dictation.ts`, `doctor.ts`. **Plus** the v1.3 addition `recipesApi.ts` (HTTP client for Recipes endpoints — the one non-ACP exception).

**Upstream pin:** all frozen-zone files copied at `df302d74` for v1.0. No syncing during v1.0. Sync cadence (cherry-pick on demand via `tandem/sync/<date>` branches) starts in v1.1.

### `ui/tandem/src-tauri/` — Tauri Rust backend
Copied from `ui/goose2/src-tauri/`. Only `tauri.conf.json` (identifier, productName, devUrl), `Cargo.toml` (package + lib name), and `icons/` differ. All 13 Rust command files byte-for-byte identical to goose2.

---

## Architecture: what we own

### Shell components (full rewrite in Tandem design)
New components, no goose2 equivalent:
- `AppShell` — 5-zone layout
- `Ribbon` — 44px app switcher
- `LeftPane` — collapsible (280px → 52px)
- `SectionSwitcher` — 5 sections
- `TabBar` — multi-tab chat, `+` new tab
- `RightPane` — collapsible (320px → 44px)
- `StatusBar` — 24px bottom strip with 6 items (connection dot · model · context folder · MCP count · session count · skills count)

### State (keep — same data model)
Ported from goose2: `chatStore`, `chatSessionStore`, `agentStore`, `projectStore`, `providerInventoryStore`. Same Zustand stores, same API surface.

### Leaf components (adapt: keep logic, restyle)
50 AI element renderers in `shared/ui/ai-elements/`. **Strategy:** port all 50 with Tailwind classes preserved; the 12 always-on (`message`, `conversation`, `code-block`, `tool`, `reasoning`, `chain-of-thought`, `shimmer`, `attachments`, `prompt-input`, `model-selector`, `persona`, `suggestion`) get restyled to Tandem tokens in v1.0. The other 38 stay Tailwind-classed and are migrated progressively.

---

## Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite |
| Desktop shell | Tauri 2 |
| State management | Zustand |
| Component primitives | Radix UI + shadcn/ui |
| Styling | Tailwind v4 + Tandem CSS custom properties |
| Icons | `lucide-react` (everywhere) |
| Code highlighting | `shiki` + `react-syntax-highlighter` (already deps in goose2) |
| Language | TypeScript |
| Package manager | pnpm |
| Testing | Vitest + React Testing Library, colocated `__tests__/`, `*.test.tsx` |

### Styling strategy (hybrid)
- `colors_and_type.css` is the single source of truth for tokens
- Shell/layout components: pure `var(--token)` CSS
- Restyled leaf components: Tandem tokens via class overrides
- Other ported leaves: Tailwind classes kept, migrated progressively
- Tailwind v4 `@theme` block maps to Tandem tokens

---

## Sections & features

| Section | Backend | v1.0 | Lands in |
|---|---|---|---|
| Chat | ACP WebSocket | Full — multi-tab, message list, composer, empty state, session history | v1.0 |
| Projects | `projectStore` + projects API | Stub body | v1.2 |
| Memory | none yet | Stub body | v1.4 (placeholder), real treatment TBD |
| Workflows | goose-server HTTP `/recipes/*` | Stub body | v1.3 |
| Skills | ACP `GooseSourcesList/Create/Delete` | Stub body | v1.2 |

---

## Decisions log (one-liners — full reasoning in `Notes/Tandem v1.0 Plan.md`)

| Topic | Decision |
|---|---|
| Directory structure | New `ui/tandem/` alongside `ui/goose2/` (goose2 untouched as reference) |
| Tauri backend | Copy `ui/goose2/src-tauri/` → adapt config only |
| ACP/API layer | Copy `ui/goose2/src/shared/api/` into `ui/tandem/src/shared/api/`, frozen, pinned to `df302d74` |
| i18n | None — no `react-intl`, hardcoded English throughout |
| Icons | `lucide-react` everywhere, no emoji |
| Ribbon vs Section Switcher | Ribbon = app switcher; Section Switcher = 5 sections within Chat |
| Stub treatment | Ribbon stubs = toast; Section Switcher stubs = stub body with version-targeted message |
| AI elements | Port all 50, restyle 12 always-on to Tandem tokens in v1.0 |
| Empty state animation | Hard swap, no animation in v1.0 |
| Permission UX | Auto-approve in v1.0 (matches goose2's frozen behavior) |
| Tab persistence | IDs + active tab in localStorage; drafts deferred |
| Window chrome | Native Windows decorations in v1.0 |
| First-launch fallback | Persistent banner if no providers configured |
| Status bar | 6 items (connection dot · model · context folder · MCP count · session count · skills count) |
| Composer footer | Model picker interactive; MCP / context folder / token counter read-only in v1.0 |
| Phase 0 acceptance | 8-criteria bootstrap screen — see `Notes/Tandem v1.0 Plan.md` |
| Branching | Per-phase branches; merge-commit (not squash); tag `tandem/v<MAJOR.MINOR>` at release boundaries |
| Tests | Inherit goose2 stack; phase-level integration-seam tests; no CI in v1.0 |
| Upstream sync | Pin to `df302d74` for v1.0; sync cadence starts v1.1 |
| Vite/Tauri pre-flight | Run `pnpm tauri dev` in `ui/goose2/` BEFORE any Tandem scaffold work |
