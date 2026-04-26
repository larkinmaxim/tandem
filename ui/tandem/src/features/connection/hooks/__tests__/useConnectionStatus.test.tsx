import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/shared/api/acpConnection", () => ({
  getClient: vi.fn(),
}));

import { getClient } from "@/shared/api/acpConnection";
import { useConnectionStatus } from "@/features/connection/hooks/useConnectionStatus";

const mockedGetClient = getClient as unknown as ReturnType<typeof vi.fn>;

describe("useConnectionStatus", () => {
  beforeEach(() => {
    mockedGetClient.mockReset();
  });

  it("starts in 'connecting'", () => {
    mockedGetClient.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("connecting");
  });

  it("transitions to 'connected' once getClient resolves", async () => {
    const closed = new Promise(() => {});
    mockedGetClient.mockResolvedValue({ closed });
    const { result } = renderHook(() => useConnectionStatus());
    await waitFor(() => expect(result.current).toBe("connected"));
  });

  it("transitions to 'failed' if getClient rejects", async () => {
    mockedGetClient.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useConnectionStatus());
    await waitFor(() => expect(result.current).toBe("failed"));
  });

  it("transitions to 'failed' when the underlying client closes", async () => {
    let resolveClosed: () => void = () => {};
    const closed = new Promise<void>((resolve) => {
      resolveClosed = resolve;
    });
    mockedGetClient.mockResolvedValue({ closed });
    const { result } = renderHook(() => useConnectionStatus());
    await waitFor(() => expect(result.current).toBe("connected"));
    resolveClosed();
    await waitFor(() => expect(result.current).toBe("failed"));
  });
});
