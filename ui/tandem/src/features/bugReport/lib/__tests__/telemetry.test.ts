import { describe, expect, it, vi, beforeEach } from "vitest";
import { emitBugReportSubmitted } from "../telemetry";

const mockInvoke = vi.fn();
const mockFetch = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", mockFetch);
});

describe("emitBugReportSubmitted", () => {
  it("skips fetch when telemetry is disabled", async () => {
    mockInvoke.mockResolvedValue(true);

    await emitBugReportSubmitted({
      has_description: true,
      has_screenshot: false,
      has_session: false,
    });

    expect(mockInvoke).toHaveBeenCalledWith("is_telemetry_disabled");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends fetch with expected payload when telemetry is enabled", async () => {
    mockInvoke.mockResolvedValue(false);

    await emitBugReportSubmitted({
      has_description: true,
      has_screenshot: true,
      has_session: false,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://us.i.posthog.com/capture/");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body.event).toBe("bug_report_submitted");
    expect(body.properties).toEqual({
      has_description: true,
      has_screenshot: true,
      has_session: false,
    });
    expect(body.api_key).toBe(
      "phc_RyX5CaY01VtZJCQyhSR5KFh6qimUy81YwxsEpotAftT",
    );
  });

  it("does not throw when fetch fails", async () => {
    mockInvoke.mockResolvedValue(false);
    mockFetch.mockRejectedValue(new Error("network error"));

    await expect(
      emitBugReportSubmitted({
        has_description: false,
        has_screenshot: false,
        has_session: false,
      }),
    ).resolves.toBeUndefined();
  });

  it("does not throw when invoke fails", async () => {
    mockInvoke.mockRejectedValue(new Error("tauri error"));

    await expect(
      emitBugReportSubmitted({
        has_description: false,
        has_screenshot: false,
        has_session: false,
      }),
    ).resolves.toBeUndefined();
  });
});
