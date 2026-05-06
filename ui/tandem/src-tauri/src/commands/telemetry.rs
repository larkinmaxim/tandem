use crate::services::goose_config::GooseConfig;
use tauri::State;

#[tauri::command]
pub fn is_telemetry_disabled(config: State<GooseConfig>) -> bool {
    if let Ok(val) = std::env::var("GOOSE_TELEMETRY_OFF") {
        if val == "1" || val.eq_ignore_ascii_case("true") {
            return true;
        }
    }

    if let Some(val) = config.get_param("GOOSE_TELEMETRY_ENABLED") {
        if val.eq_ignore_ascii_case("false") || val == "0" {
            return true;
        }
    }

    false
}
