use base64::Engine;
use chrono::Utc;
use etcetera::{AppStrategy, AppStrategyArgs, choose_app_strategy};
use regex::Regex;
use serde::Serialize;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::ZipWriter;
use zip::write::FileOptions;

const MAX_FILE_BYTES: u64 = 1_048_576; // 1 MB
const OMISSION_MARKER: &str = "\n... ({} bytes omitted) ...\n";
const TAIL_BYTES: usize = 4096;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BugReportResult {
    pub zip_path: String,
    pub manifest: String,
}

fn app_strategy() -> Option<AppStrategyArgs> {
    Some(AppStrategyArgs {
        top_level_domain: "Block".to_string(),
        author: "Block".to_string(),
        app_name: "goose".to_string(),
    })
}

fn resolve_state_dir() -> Option<PathBuf> {
    if let Ok(root) = std::env::var("GOOSE_PATH_ROOT") {
        return Some(PathBuf::from(root).join("state"));
    }
    let strategy = choose_app_strategy(app_strategy()?).ok()?;
    Some(strategy.state_dir().unwrap_or_else(|| strategy.data_dir()))
}

fn resolve_config_dir() -> Option<PathBuf> {
    if let Ok(root) = std::env::var("GOOSE_PATH_ROOT") {
        return Some(PathBuf::from(root).join("config"));
    }
    choose_app_strategy(app_strategy()?)
        .ok()
        .map(|s| s.config_dir())
}

fn resolve_data_dir() -> Option<PathBuf> {
    if let Ok(root) = std::env::var("GOOSE_PATH_ROOT") {
        return Some(PathBuf::from(root).join("data"));
    }
    choose_app_strategy(app_strategy()?)
        .ok()
        .map(|s| s.data_dir())
}

fn build_secret_patterns() -> Vec<Regex> {
    [
        r"sk-ant-[A-Za-z0-9_\-]{20,}",
        r"sk-[A-Za-z0-9_\-]{20,}",
        r"ghp_[A-Za-z0-9]{36}",
        r"github_pat_[A-Za-z0-9_]{82}",
        r"xox[baprs]-[A-Za-z0-9\-]{10,}",
        r"AKIA[0-9A-Z]{16}",
        r"eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+",
        r#"Bearer\s+[A-Za-z0-9_.\-]+"#,
        r#"(?i)"?authorization"?\s*:\s*"?[^"\n,}]+"#,
    ]
    .iter()
    .filter_map(|p| Regex::new(p).ok())
    .collect()
}

fn is_sensitive_yaml_key(key: &str) -> bool {
    let lower = key.to_lowercase();
    ["key", "secret", "token", "password", "credential", "auth"]
        .iter()
        .any(|k| lower.contains(k))
}

fn scrub_text(text: &str, patterns: &[Regex]) -> String {
    let mut result = text.to_string();
    for pattern in patterns {
        result = pattern.replace_all(&result, "[REDACTED]").into_owned();
    }
    result
}

fn redact_yaml_value(value: &mut serde_yaml::Value) {
    match value {
        serde_yaml::Value::Mapping(map) => {
            for (k, v) in map.iter_mut() {
                let key_str = k.as_str().unwrap_or_default();
                if is_sensitive_yaml_key(key_str) {
                    *v = serde_yaml::Value::String("[REDACTED]".to_string());
                } else {
                    redact_yaml_value(v);
                }
            }
        }
        serde_yaml::Value::Sequence(seq) => {
            for item in seq.iter_mut() {
                redact_yaml_value(item);
            }
        }
        _ => {}
    }
}

fn redact_config_yaml(contents: &str) -> String {
    match serde_yaml::from_str::<serde_yaml::Value>(contents) {
        Ok(mut value) => {
            redact_yaml_value(&mut value);
            serde_yaml::to_string(&value).unwrap_or_else(|_| "[REDACTED CONFIG]".to_string())
        }
        Err(_) => "[UNPARSEABLE CONFIG]".to_string(),
    }
}

fn cap_file_content(raw: &[u8]) -> Vec<u8> {
    if (raw.len() as u64) <= MAX_FILE_BYTES {
        return raw.to_vec();
    }

    let head_bytes = (MAX_FILE_BYTES as usize) - TAIL_BYTES;
    let omitted = raw.len() - head_bytes - TAIL_BYTES;
    let marker = OMISSION_MARKER.replace("{}", &omitted.to_string());

    let mut out = Vec::with_capacity(head_bytes + marker.len() + TAIL_BYTES);
    out.extend_from_slice(&raw[..head_bytes]);
    out.extend_from_slice(marker.as_bytes());
    out.extend_from_slice(&raw[raw.len() - TAIL_BYTES..]);
    out
}

fn find_latest_in_dir(dir: &Path) -> Option<PathBuf> {
    std::fs::read_dir(dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|ft| ft.is_file()).unwrap_or(false))
        .max_by_key(|e| e.metadata().and_then(|m| m.modified()).ok())
        .map(|e| e.path())
}

fn find_latest_subdir(dir: &Path) -> Option<PathBuf> {
    std::fs::read_dir(dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
        .max_by_key(|e| e.file_name())
        .map(|e| e.path())
}

fn find_latest_server_log(state_dir: &Path) -> Option<PathBuf> {
    let server_log_dir = state_dir.join("logs").join("server");
    let latest_date_dir = find_latest_subdir(&server_log_dir)?;
    find_latest_in_dir(&latest_date_dir)
}

fn collect_jsonl_logs(state_dir: &Path) -> Vec<(String, PathBuf)> {
    let logs_dir = state_dir.join("logs");
    let mut entries = Vec::new();
    if let Ok(reader) = std::fs::read_dir(&logs_dir) {
        for entry in reader.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "jsonl" {
                        let name = path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();
                        entries.push((format!("logs/{name}"), path));
                    }
                }
            }
        }
    }
    entries
}

fn extract_recent_errors(log_path: &Path, max_lines: usize) -> String {
    let contents = match std::fs::read_to_string(log_path) {
        Ok(c) => c,
        Err(_) => return "_No recent errors._".to_string(),
    };

    let error_lines: Vec<&str> = contents
        .lines()
        .filter(|line| {
            let upper = line.to_uppercase();
            upper.contains("WARN") || upper.contains("ERROR")
        })
        .collect();

    if error_lines.is_empty() {
        return "_No recent errors._".to_string();
    }

    let start = error_lines.len().saturating_sub(max_lines);
    error_lines[start..].join("\n")
}

fn build_system_txt() -> String {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let timestamp = Utc::now().to_rfc3339();
    let app_version = env!("CARGO_PKG_VERSION");

    format!("OS: {os}\nArch: {arch}\nApp version: {app_version}\nTimestamp: {timestamp}\n")
}

fn resolve_output_dir() -> PathBuf {
    if let Some(dl) = dirs::download_dir() {
        if dl.is_dir() {
            return dl;
        }
    }
    if let Some(home) = dirs::home_dir() {
        if home.is_dir() {
            return home;
        }
    }
    std::env::temp_dir()
}

fn build_manifest(recent_errors: &str, session_id: Option<&str>) -> String {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let app_version = env!("CARGO_PKG_VERSION");

    let session_line = match session_id {
        Some(id) => format!("- Session: {id}"),
        None => "- Session: (none)".to_string(),
    };

    let errors_section = if recent_errors == "_No recent errors._" {
        "_No recent errors._".to_string()
    } else {
        format!(
            "<details>\n<summary>Last errors/warnings</summary>\n\n```\n{recent_errors}\n```\n</details>"
        )
    };

    format!(
        "## Environment\n\n\
         - App version: {app_version}\n\
         - OS: {os}\n\
         - Arch: {arch}\n\
         {session_line}\n\n\
         ## Recent errors\n\n\
         {errors_section}\n\n\
         ## Diagnostics\n\n\
         _See attached ZIP file._\n"
    )
}

fn add_file_to_zip<W: Write + std::io::Seek>(
    zip: &mut ZipWriter<W>,
    zip_name: &str,
    content: &[u8],
) -> Result<(), String> {
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    zip.start_file(zip_name, options)
        .map_err(|e| format!("Failed to start ZIP entry '{zip_name}': {e}"))?;
    zip.write_all(content)
        .map_err(|e| format!("Failed to write ZIP entry '{zip_name}': {e}"))?;
    Ok(())
}

pub fn bundle_bug_report_impl(
    screenshots: Vec<String>,
    output_dir: Option<PathBuf>,
    session_id: Option<String>,
    session_json: Option<String>,
) -> Result<BugReportResult, String> {
    let secret_patterns = build_secret_patterns();
    let state_dir = resolve_state_dir();
    let config_dir = resolve_config_dir();
    let data_dir = resolve_data_dir();

    let out_dir = output_dir.unwrap_or_else(resolve_output_dir);
    let timestamp = Utc::now().format("%Y%m%dT%H%M%S").to_string();
    let zip_filename = format!("tandem-bug-{timestamp}.zip");
    let zip_path = out_dir.join(&zip_filename);

    let file =
        std::fs::File::create(&zip_path).map_err(|e| format!("Failed to create ZIP file: {e}"))?;
    let mut zip = ZipWriter::new(file);

    // system.txt
    let system_txt = build_system_txt();
    add_file_to_zip(&mut zip, "system.txt", system_txt.as_bytes())?;

    // config.yaml (redacted by key)
    if let Some(ref cfg_dir) = config_dir {
        let config_path = cfg_dir.join("config.yaml");
        if config_path.is_file() {
            if let Ok(contents) = std::fs::read_to_string(&config_path) {
                let redacted = redact_config_yaml(&contents);
                add_file_to_zip(&mut zip, "config.yaml", redacted.as_bytes())?;
            }
        }
    }

    // schedule.json
    if let Some(ref d_dir) = data_dir {
        let schedule_path = d_dir.join("schedule.json");
        if schedule_path.is_file() {
            if let Ok(raw) = std::fs::read(&schedule_path) {
                let capped = cap_file_content(&raw);
                let text = String::from_utf8_lossy(&capped);
                let scrubbed = scrub_text(&text, &secret_patterns);
                add_file_to_zip(&mut zip, "schedule.json", scrubbed.as_bytes())?;
            }
        }
    }

    // JSONL logs from state_dir/logs/
    if let Some(ref s_dir) = state_dir {
        for (zip_name, path) in collect_jsonl_logs(s_dir) {
            if let Ok(raw) = std::fs::read(&path) {
                let capped = cap_file_content(&raw);
                let text = String::from_utf8_lossy(&capped);
                let scrubbed = scrub_text(&text, &secret_patterns);
                add_file_to_zip(&mut zip, &zip_name, scrubbed.as_bytes())?;
            }
        }
    }

    // Latest server log
    let mut recent_errors = "_No recent errors._".to_string();
    if let Some(ref s_dir) = state_dir {
        if let Some(log_path) = find_latest_server_log(s_dir) {
            recent_errors = extract_recent_errors(&log_path, 20);
            let recent_errors_scrubbed = scrub_text(&recent_errors, &secret_patterns);
            recent_errors = recent_errors_scrubbed;

            if let Ok(raw) = std::fs::read(&log_path) {
                let capped = cap_file_content(&raw);
                let text = String::from_utf8_lossy(&capped);
                let scrubbed = scrub_text(&text, &secret_patterns);
                add_file_to_zip(&mut zip, "server.log", scrubbed.as_bytes())?;
            }
        }
    }

    // Session export (scrubbed)
    if let Some(ref json) = session_json {
        let scrubbed = scrub_text(json, &secret_patterns);
        add_file_to_zip(&mut zip, "session.json", scrubbed.as_bytes())?;
    }

    // Screenshots (base64 -> PNG)
    for (i, b64) in screenshots.iter().enumerate() {
        match base64::engine::general_purpose::STANDARD.decode(b64) {
            Ok(bytes) => {
                let name = format!("screenshot-{}.png", i + 1);
                add_file_to_zip(&mut zip, &name, &bytes)?;
            }
            Err(e) => {
                log::warn!("Skipping screenshot {}: {e}", i + 1);
            }
        }
    }

    zip.finish()
        .map_err(|e| format!("Failed to finalize ZIP: {e}"))?;

    let manifest = build_manifest(&recent_errors, session_id.as_deref());

    Ok(BugReportResult {
        zip_path: zip_path.to_string_lossy().into_owned(),
        manifest,
    })
}

async fn fetch_session_export(port: u16, session_id: &str) -> Option<String> {
    let url = format!("http://127.0.0.1:{port}/sessions/{session_id}/export");
    let resp = reqwest::get(&url).await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    resp.json::<String>().await.ok()
}

#[tauri::command]
pub async fn bundle_bug_report(
    app_handle: tauri::AppHandle,
    screenshots: Vec<String>,
    session_id: Option<String>,
) -> Result<BugReportResult, String> {
    let session_json = if let Some(ref sid) = session_id {
        match crate::services::acp::GooseServeProcess::get(app_handle).await {
            Ok(process) => {
                let ws_url = process.ws_url();
                let port = ws_url
                    .split(':')
                    .last()
                    .and_then(|s| s.trim_end_matches("/acp").parse::<u16>().ok());
                if let Some(port) = port {
                    fetch_session_export(port, sid).await
                } else {
                    None
                }
            }
            Err(_) => None,
        }
    } else {
        None
    };

    tokio::task::spawn_blocking(move || {
        bundle_bug_report_impl(screenshots, None, session_id, session_json)
    })
    .await
    .map_err(|e| format!("Bug report task failed: {e}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    fn setup_fixture_dirs(root: &Path) -> (PathBuf, PathBuf, PathBuf) {
        let state = root.join("state");
        let config = root.join("config");
        let data = root.join("data");
        fs::create_dir_all(state.join("logs").join("server").join("2026-01-01")).unwrap();
        fs::create_dir_all(&config).unwrap();
        fs::create_dir_all(&data).unwrap();
        (state, config, data)
    }

    #[test]
    fn scrub_removes_openai_key() {
        let patterns = build_secret_patterns();
        let input = "my key is sk-abc123def456ghi789jkl012345";
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("sk-abc123"));
    }

    #[test]
    fn scrub_removes_anthropic_key() {
        let patterns = build_secret_patterns();
        let input = "key: sk-ant-abcdefghijklmnopqrstuvwxyz1234567890";
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("sk-ant-"));
    }

    #[test]
    fn scrub_removes_github_pat() {
        let patterns = build_secret_patterns();
        let input = "token: ghp_AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDDEEEE";
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("ghp_"));
    }

    #[test]
    fn scrub_removes_github_fine_grained_pat() {
        let patterns = build_secret_patterns();
        let long_pat = format!("github_pat_{}", "A".repeat(82));
        let input = format!("token: {long_pat}");
        let result = scrub_text(&input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("github_pat_"));
    }

    #[test]
    fn scrub_removes_slack_token() {
        let patterns = build_secret_patterns();
        let input = "SLACK_TOKEN=xoxb-1234567890-abcdef";
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("xoxb-"));
    }

    #[test]
    fn scrub_removes_aws_key() {
        let patterns = build_secret_patterns();
        let input = "aws_key = AKIAIOSFODNN7EXAMPLE";
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("AKIA"));
    }

    #[test]
    fn scrub_removes_bearer_token() {
        let patterns = build_secret_patterns();
        let input = "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test.sig";
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("Bearer eyJ"));
    }

    #[test]
    fn scrub_removes_authorization_header() {
        let patterns = build_secret_patterns();
        let input = r#""authorization": "Basic dXNlcjpwYXNz""#;
        let result = scrub_text(input, &patterns);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("dXNlcjpwYXNz"));
    }

    #[test]
    fn scrub_preserves_safe_text() {
        let patterns = build_secret_patterns();
        let input = "This is a normal log line with no secrets";
        let result = scrub_text(input, &patterns);
        assert_eq!(result, input);
    }

    #[test]
    fn redact_yaml_replaces_sensitive_keys() {
        let yaml = r#"
OPENAI_API_KEY: sk-real-key-here
GOOSE_MODEL: gpt-4
database_password: hunter2
auth_token: abc123
normal_setting: keep-this
"#;
        let result = redact_config_yaml(yaml);
        assert!(result.contains("[REDACTED]"));
        assert!(!result.contains("sk-real-key-here"));
        assert!(!result.contains("hunter2"));
        assert!(!result.contains("abc123"));
        assert!(result.contains("keep-this"));
        assert!(result.contains("gpt-4"));
    }

    #[test]
    fn cap_file_content_passes_small_file() {
        let content = b"small file";
        let result = cap_file_content(content);
        assert_eq!(result, content);
    }

    #[test]
    fn cap_file_content_truncates_large_file() {
        let big = vec![b'x'; 2_000_000];
        let result = cap_file_content(&big);
        assert!((result.len() as u64) <= MAX_FILE_BYTES + 200);
        let text = String::from_utf8_lossy(&result);
        assert!(text.contains("bytes omitted"));
    }

    #[test]
    fn bundle_excludes_prompts_and_scheduled_recipes() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let (state, config, data) = setup_fixture_dirs(root);

        // Create excluded directories with files
        let prompts_dir = data.join("prompts");
        let recipes_dir = data.join("scheduled_recipes");
        fs::create_dir_all(&prompts_dir).unwrap();
        fs::create_dir_all(&recipes_dir).unwrap();
        fs::write(prompts_dir.join("test.txt"), "should not appear").unwrap();
        fs::write(recipes_dir.join("recipe.yaml"), "should not appear").unwrap();

        // Create config.yaml so there's something to bundle
        fs::write(config.join("config.yaml"), "model: gpt-4\n").unwrap();

        std::env::set_var("GOOSE_PATH_ROOT", root.to_string_lossy().as_ref());
        let output_dir = root.join("output");
        fs::create_dir_all(&output_dir).unwrap();

        let result = bundle_bug_report_impl(vec![], Some(output_dir), None, None).unwrap();
        std::env::remove_var("GOOSE_PATH_ROOT");

        // Read the ZIP and verify excluded files are absent
        let file = fs::File::open(&result.zip_path).unwrap();
        let mut archive = zip::ZipArchive::new(file).unwrap();
        let names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().to_string())
            .collect();

        assert!(!names.iter().any(|n| n.contains("prompts")));
        assert!(!names.iter().any(|n| n.contains("scheduled_recipes")));
        assert!(names.contains(&"system.txt".to_string()));
        assert!(names.contains(&"config.yaml".to_string()));
    }

    #[test]
    fn manifest_has_environment_block() {
        let manifest = build_manifest("_No recent errors._", None);
        assert!(manifest.contains("## Environment"));
        assert!(manifest.contains("App version:"));
        assert!(manifest.contains("Session: (none)"));
    }

    #[test]
    fn manifest_shows_session_id_when_provided() {
        let manifest = build_manifest("_No recent errors._", Some("abc-123"));
        assert!(manifest.contains("Session: abc-123"));
        assert!(!manifest.contains("(none)"));
    }

    #[test]
    fn manifest_includes_error_details() {
        let errors = "2026-01-01 ERROR something broke\n2026-01-01 WARN disk full";
        let manifest = build_manifest(errors, None);
        assert!(manifest.contains("<details>"));
        assert!(manifest.contains("something broke"));
        assert!(manifest.contains("disk full"));
    }

    #[test]
    fn extract_recent_errors_from_log() {
        let dir = tempdir().unwrap();
        let log_path = dir.path().join("test.log");
        let content = (0..30)
            .map(|i| {
                if i % 5 == 0 {
                    format!("2026-01-01 ERROR failure {i}")
                } else if i % 7 == 0 {
                    format!("2026-01-01 WARN warning {i}")
                } else {
                    format!("2026-01-01 INFO normal {i}")
                }
            })
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(&log_path, content).unwrap();

        let result = extract_recent_errors(&log_path, 5);
        let lines: Vec<&str> = result.lines().collect();
        assert!(lines.len() <= 5);
        assert!(
            lines
                .iter()
                .all(|l| l.contains("ERROR") || l.contains("WARN"))
        );
    }

    #[test]
    fn extract_recent_errors_returns_fallback_on_missing_file() {
        let missing = PathBuf::from("/nonexistent/path/log.txt");
        let result = extract_recent_errors(&missing, 20);
        assert_eq!(result, "_No recent errors._");
    }

    #[test]
    fn screenshots_written_to_zip() {
        let dir = tempdir().unwrap();
        let output_dir = dir.path().join("output");
        fs::create_dir_all(&output_dir).unwrap();

        // 1x1 red PNG
        let png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

        std::env::set_var(
            "GOOSE_PATH_ROOT",
            dir.path().join("fake").to_string_lossy().as_ref(),
        );
        let result =
            bundle_bug_report_impl(vec![png_b64.to_string()], Some(output_dir), None, None)
                .unwrap();
        std::env::remove_var("GOOSE_PATH_ROOT");

        let file = fs::File::open(&result.zip_path).unwrap();
        let mut archive = zip::ZipArchive::new(file).unwrap();
        let names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().to_string())
            .collect();

        assert!(names.contains(&"screenshot-1.png".to_string()));
    }

    #[test]
    fn scrubbed_server_log_in_zip() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let (state, _config, _data) = setup_fixture_dirs(root);

        let log_dir = state.join("logs").join("server").join("2026-01-01");
        fs::write(
            log_dir.join("server.log"),
            "INFO normal\nERROR secret key sk-abc123def456ghi789jkl012345 leaked\n",
        )
        .unwrap();

        std::env::set_var("GOOSE_PATH_ROOT", root.to_string_lossy().as_ref());
        let output_dir = root.join("output");
        fs::create_dir_all(&output_dir).unwrap();
        let result = bundle_bug_report_impl(vec![], Some(output_dir), None, None).unwrap();
        std::env::remove_var("GOOSE_PATH_ROOT");

        let file = fs::File::open(&result.zip_path).unwrap();
        let mut archive = zip::ZipArchive::new(file).unwrap();

        let mut log_entry = archive.by_name("server.log").unwrap();
        let mut contents = String::new();
        log_entry.read_to_string(&mut contents).unwrap();

        assert!(contents.contains("[REDACTED]"));
        assert!(!contents.contains("sk-abc123"));
    }

    #[test]
    fn session_json_included_and_scrubbed() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let (_state, _config, _data) = setup_fixture_dirs(root);

        std::env::set_var("GOOSE_PATH_ROOT", root.to_string_lossy().as_ref());
        let output_dir = root.join("output");
        fs::create_dir_all(&output_dir).unwrap();

        let session_json =
            r#"{"id":"sess-1","messages":[{"content":"key sk-abc123def456ghi789jkl012345"}]}"#;

        let result = bundle_bug_report_impl(
            vec![],
            Some(output_dir),
            Some("sess-1".to_string()),
            Some(session_json.to_string()),
        )
        .unwrap();
        std::env::remove_var("GOOSE_PATH_ROOT");

        assert!(result.manifest.contains("Session: sess-1"));

        let file = fs::File::open(&result.zip_path).unwrap();
        let mut archive = zip::ZipArchive::new(file).unwrap();

        let mut entry = archive.by_name("session.json").unwrap();
        let mut contents = String::new();
        entry.read_to_string(&mut contents).unwrap();

        assert!(contents.contains("[REDACTED]"));
        assert!(!contents.contains("sk-abc123"));
        assert!(contents.contains("sess-1"));
    }

    #[test]
    fn no_session_json_when_none_provided() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let (_state, _config, _data) = setup_fixture_dirs(root);

        std::env::set_var("GOOSE_PATH_ROOT", root.to_string_lossy().as_ref());
        let output_dir = root.join("output");
        fs::create_dir_all(&output_dir).unwrap();

        let result = bundle_bug_report_impl(vec![], Some(output_dir), None, None).unwrap();
        std::env::remove_var("GOOSE_PATH_ROOT");

        assert!(result.manifest.contains("Session: (none)"));

        let file = fs::File::open(&result.zip_path).unwrap();
        let archive = zip::ZipArchive::new(file).unwrap();
        let names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().to_string())
            .collect();

        assert!(!names.contains(&"session.json".to_string()));
    }

    #[test]
    fn resolve_state_dir_never_returns_none() {
        let dir = tempdir().unwrap();
        std::env::set_var("GOOSE_PATH_ROOT", dir.path().to_string_lossy().as_ref());
        let result = resolve_state_dir();
        std::env::remove_var("GOOSE_PATH_ROOT");
        assert!(result.is_some());
        assert_eq!(result.unwrap(), dir.path().join("state"));
    }
}
