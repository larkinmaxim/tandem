import { invoke } from "@tauri-apps/api/core";

const POSTHOG_API_KEY = "phc_RyX5CaY01VtZJCQyhSR5KFh6qimUy81YwxsEpotAftT";
const POSTHOG_CAPTURE_URL = "https://us.i.posthog.com/capture/";

interface BugReportPayload {
  has_description: boolean;
  has_screenshot: boolean;
  has_session: boolean;
}

export async function emitBugReportSubmitted(
  payload: BugReportPayload,
): Promise<void> {
  try {
    const disabled = await invoke<boolean>("is_telemetry_disabled");
    if (disabled) return;

    await fetch(POSTHOG_CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event: "bug_report_submitted",
        distinct_id: "tandem-desktop",
        properties: {
          has_description: payload.has_description,
          has_screenshot: payload.has_screenshot,
          has_session: payload.has_session,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silent — never block the user or surface errors
  }
}
