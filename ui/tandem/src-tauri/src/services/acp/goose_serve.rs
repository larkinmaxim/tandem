use tauri_plugin_shell::ShellExt;

use std::path::PathBuf;
use std::time::{Duration, Instant};

use tokio::process::{Child, Command};
use tokio::sync::OnceCell;

const GOOSE_SERVE_CONNECT_TIMEOUT: Duration = Duration::from_secs(30);
const GOOSE_SERVE_CONNECT_RETRY_DELAY: Duration = Duration::from_millis(100);
const LOCALHOST: &str = "127.0.0.1";
// ---------------------------------------------------------------------------
// GooseServeProcess — singleton that owns the long-lived `goose serve` child
// ---------------------------------------------------------------------------

/// A long-lived `goose serve` process that accepts WebSocket connections.
///
/// Each WebSocket connection to the `/acp` endpoint creates an independent
/// ACP agent inside the server, so a single process can serve any number of
/// concurrent sessions.
pub struct GooseServeProcess {
    port: u16,
    secret: String,
    _child: Child,
}

/// Global singleton — initialised once at app startup.
static GOOSE_SERVE: OnceCell<GooseServeProcess> = OnceCell::const_new();

impl GooseServeProcess {
    /// Return the WebSocket URL for connecting to this server.
    pub fn ws_url(&self) -> String {
        format!("ws://{LOCALHOST}:{}/acp", self.port)
    }

    pub fn secret_key(&self) -> &str {
        &self.secret
    }

    /// Get a reference to the running process, or an error if it was never
    /// started (should not happen in normal operation).
    pub async fn get(app_handle: tauri::AppHandle) -> Result<&'static GooseServeProcess, String> {
        GOOSE_SERVE
            .get_or_try_init(|| async { Self::spawn(app_handle).await })
            .await
    }

    async fn spawn(app_handle: tauri::AppHandle) -> Result<GooseServeProcess, String> {
        let port = reserve_free_port()?;
        let secret = hex::encode(rand::random::<[u8; 32]>());

        // Use a stable working directory for the long-lived server process.
        // Individual sessions will set their own cwd via the ACP protocol.
        let working_dir = default_serve_working_dir();
        std::fs::create_dir_all(&working_dir).map_err(|e| {
            format!(
                "Failed to create goose serve working directory {}: {e}",
                working_dir.display()
            )
        })?;

        let mut command: Command = get_goose_command(&app_handle)?;
        let binary_display = command.as_std().get_program().to_string_lossy().to_string();

        command
            .arg("serve")
            .arg("--host")
            .arg(LOCALHOST)
            .arg("--port")
            .arg(port.to_string())
            .env("GOOSE_SERVER__SECRET_KEY", &secret)
            .current_dir(&working_dir)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true);

        log::info!(
            "Spawning long-lived goose serve: binary={binary_display} port={port} cwd={}",
            working_dir.display(),
        );

        let mut child = command.spawn().map_err(|error| {
            format!(
                "Failed to spawn goose serve (binary: {binary_display}, cwd: {}): {error}",
                working_dir.display()
            )
        })?;

        wait_for_server_ready(port, &mut child).await?;

        log::info!("Goose serve is ready on port {port}");

        Ok(GooseServeProcess {
            port,
            secret,
            _child: child,
        })
    }
}

pub fn get_goose_command(app_handle: &tauri::AppHandle) -> Result<Command, String> {
    if let Ok(override_path) = std::env::var("GOOSE_BIN") {
        return Ok(Command::new(override_path));
    }

    let tauri_command = app_handle
        .shell()
        .sidecar("goose")
        .map_err(|e| format!("could not resolve goose binary: {e}"))?;
    let std_command: std::process::Command = tauri_command.into();

    // tauri.dev.conf.json sets `externalBin: []` so the sidecar isn't packaged
    // in dev. Fall back to the workspace's debug build of goose-cli when the
    // sidecar path doesn't exist, so devs don't need to set GOOSE_BIN by hand.
    #[cfg(debug_assertions)]
    {
        let resolved = std::path::Path::new(std_command.get_program());
        if !resolved.exists() {
            if let Some(fallback) = workspace_goose_binary() {
                if fallback.exists() {
                    log::info!(
                        "Sidecar goose binary not found at {}; using workspace fallback {}",
                        resolved.display(),
                        fallback.display()
                    );
                    return Ok(Command::new(fallback));
                }
            }
        }
    }

    Ok(std_command.into())
}

#[cfg(debug_assertions)]
fn workspace_goose_binary() -> Option<PathBuf> {
    // CARGO_MANIFEST_DIR resolves at compile time to <workspace>/ui/tandem/src-tauri.
    // The goose-cli debug binary lives at <workspace>/target/debug/goose[.exe].
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let workspace_root = manifest_dir.parent()?.parent()?.parent()?;
    let bin_name = if cfg!(windows) { "goose.exe" } else { "goose" };
    Some(workspace_root.join("target").join("debug").join(bin_name))
}

async fn wait_for_server_ready(port: u16, child: &mut Child) -> Result<(), String> {
    let deadline = Instant::now() + GOOSE_SERVE_CONNECT_TIMEOUT;
    let addr = format!("{LOCALHOST}:{port}");

    loop {
        match tokio::net::TcpStream::connect(&addr).await {
            Ok(_) => return Ok(()),
            Err(_) => {
                if let Some(status) = child
                    .try_wait()
                    .map_err(|e| format!("Failed to poll goose serve process: {e}"))?
                {
                    return Err(format!(
                        "Goose serve exited before becoming ready: {status}"
                    ));
                }

                if Instant::now() >= deadline {
                    return Err(format!("Timed out waiting for goose serve on port {port}"));
                }

                tokio::time::sleep(GOOSE_SERVE_CONNECT_RETRY_DELAY).await;
            }
        }
    }
}

fn default_serve_working_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("/tmp"))
        .join(".goose")
        .join("artifacts")
}

fn reserve_free_port() -> Result<u16, String> {
    let listener = std::net::TcpListener::bind((LOCALHOST, 0))
        .map_err(|error| format!("Failed to reserve Goose serve port: {error}"))?;
    listener
        .local_addr()
        .map(|address| address.port())
        .map_err(|error| format!("Failed to resolve reserved Goose serve port: {error}"))
}
