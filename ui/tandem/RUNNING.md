# Running Tandem (dev)

Quick reference for starting `ui/tandem` in dev mode on Linux/WSL or Windows.

## TL;DR (Linux / WSL)

```bash
cd ~/work/tandem/ui                         # pnpm workspace root
pnpm install                                # only after dep changes

cd ~/work/tandem/ui/tandem
pnpm tauri dev --config src-tauri/tauri.dev.conf.json
```

Vite serves on `http://localhost:1520/`. Tauri window opens via WSLg.

## TL;DR (Windows)

The same command works on Windows once the MSVC linker is on PATH. Easiest
way is to enter the Visual Studio Developer environment in your PowerShell
session before running `pnpm tauri dev`:

```powershell
$vs = & "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" `
        -latest -products * `
        -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
        -property installationPath
Import-Module "$vs\Common7\Tools\Microsoft.VisualStudio.DevShell.dll"
Enter-VsDevShell -VsInstallPath $vs -DevCmdArguments '-arch=x64 -host_arch=x64' -SkipAutomaticLocation

cd C:\Tandem_dev\ui\tandem
pnpm tauri dev --config src-tauri\tauri.dev.conf.json
```

Equivalent: open "x64 Native Tools Command Prompt for VS" from the Start menu
(installed alongside Build Tools) and run `pnpm tauri dev` from there.

Tauri uses WebView2 for the window (preinstalled on Windows 11).

### Windows prerequisites

- **Node 22+ and pnpm 10** — match the `packageManager` field in
  `ui/tandem/package.json`.
- **Rust MSVC toolchain** — `rustup default stable-x86_64-pc-windows-msvc`.
  The repo's `rust-toolchain.toml` pins the version.
- **Visual Studio Build Tools 2022 or 2026** with the
  `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` workload (the C++ build
  tools). This installs `link.exe`, `cl.exe`, the Windows SDK, and UCRT
  headers/libs. The `Enter-VsDevShell` snippet above is what loads them.
- **WebView2 Runtime** — preinstalled on Windows 11, otherwise install the
  Evergreen Bootstrapper from Microsoft.

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
