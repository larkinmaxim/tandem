# Running Tandem (dev)

Quick reference for starting `ui/tandem` in dev mode on WSL Ubuntu.

## TL;DR

```bash
cd ~/work/tandem/ui                         # pnpm workspace root
pnpm install                                # only after dep changes

cd ~/work/tandem/ui/tandem
pnpm tauri dev --config src-tauri/tauri.dev.conf.json
```

Vite serves on `http://localhost:1520/`. Tauri window opens via WSLg.

## Why `--config src-tauri/tauri.dev.conf.json` is required

`tauri.conf.json` (production) declares the `goose` CLI as an `externalBin`:

```json
"externalBin": ["../../../target/release/goose"]
```

Without the dev override, `pnpm tauri dev` fails during the Rust build with:

```
resource path `../../../target/release/goose-x86_64-unknown-linux-gnu` doesn't exist
```

`tauri.dev.conf.json` sets `externalBin: []`, which tells Tauri to skip that
sidecar requirement at dev time. This is the same trick `ui/goose2`'s
`just dev` recipe uses.

## Full functionality (agent works, not just UI chrome)

The dev override skips packaging the sidecar but the running app still tries
to spawn `goose serve` from `src-tauri/target/debug/goose`. If that binary is
missing, chat/providers/sessions will fail to start. Build the workspace
`goose-cli` once and point `GOOSE_BIN` at it:

```bash
cd ~/work/tandem
cargo build -p goose-cli --bin goose          # ~/work/tandem/target/debug/goose

cd ui/tandem
GOOSE_BIN=~/work/tandem/target/debug/goose \
  pnpm tauri dev --config src-tauri/tauri.dev.conf.json
```

First cargo build is slow (cold compile of the goose workspace). After that,
incremental builds are fast.

## Topology reminder

- pnpm workspace root: `ui/` (not the repo root). `pnpm-workspace.yaml` at
  `ui/pnpm-workspace.yaml` lists `tandem` as a member.
- Cargo: `ui/tandem/src-tauri` is **excluded** from the root Cargo workspace
  (see commit `0c1c7989`). It builds standalone via `pnpm tauri dev`.
- Hoisted node_modules (`node-linker=hoisted` in `ui/.npmrc`) — that's why
  the Tauri `beforeDevCommand` is `pnpm dev`, not a hard-coded
  `./node_modules/.bin/vite` path.

## Common warnings (safe to ignore)

- `Unsupported engine: wanted node 24.10.0` — only the `desktop` workspace
  package wants 24; tandem runs on 22.
- `Unsupported platform` warnings for `goose-binary-darwin-*` /
  `goose-binary-win32-x64` — cross-platform sidecar packages, not used on
  Linux.
- `libEGL warning: failed to get driver name for fd -1` and Mesa/ZINK
  warnings — WSLg GL fallback. UI still renders.

## Stopping

`Ctrl-C` in the terminal running `pnpm tauri dev`. If the Vite port is stuck:

```bash
lsof -ti :1520 | xargs -r kill -9
```
