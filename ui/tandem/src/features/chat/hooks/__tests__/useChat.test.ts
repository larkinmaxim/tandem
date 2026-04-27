import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { mockAcpSendMessage, mockResolvePath } = vi.hoisted(() => ({
  mockAcpSendMessage: vi.fn(),
  mockResolvePath: vi.fn(),
}));

vi.mock("@/shared/api/acp", async (importActual) => {
  const actual = await importActual<typeof import("@/shared/api/acp")>();
  return {
    ...actual,
    acpSendMessage: mockAcpSendMessage,
  };
});

vi.mock("@/shared/api/pathResolver", () => ({
  resolvePath: mockResolvePath,
}));

import { useChat } from "@/features/chat/hooks/useChat";
import { useChatStore } from "@/features/chat/stores/chatStore";

describe("useChat (slice 8.5)", () => {
  beforeEach(() => {
    mockAcpSendMessage.mockReset();
    mockAcpSendMessage.mockResolvedValue(undefined);
    mockResolvePath.mockReset();
    mockResolvePath.mockResolvedValue({ path: "/home/test/.goose/artifacts" });
    useChatStore.setState({
      messagesBySession: {},
      sessionStateById: {},
      queuedMessageBySession: {},
      draftsBySession: {},
      activeSessionId: null,
      isConnected: false,
      loadingSessionIds: new Set<string>(),
      scrollTargetMessageBySession: {},
    });
  });

  it("forwards image attachments to acpSendMessage as options.images", async () => {
    const sessionId = "real-session-abc";
    const { result } = renderHook(() => useChat(sessionId));

    await act(async () => {
      await result.current.send("look at this", [
        {
          name: "diagram.png",
          mimeType: "image/png",
          data: "BASE64DATA",
        },
      ]);
    });

    expect(mockAcpSendMessage).toHaveBeenCalledTimes(1);
    const [callSessionId, callText, callOptions] =
      mockAcpSendMessage.mock.calls[0];
    expect(callSessionId).toBe(sessionId);
    expect(callText).toBe("look at this");
    expect(callOptions).toMatchObject({
      images: [["BASE64DATA", "image/png"]],
    });
  });

  it("does not pass options.images when no attachments are provided", async () => {
    const sessionId = "real-session-def";
    const { result } = renderHook(() => useChat(sessionId));

    await act(async () => {
      await result.current.send("hi");
    });

    expect(mockAcpSendMessage).toHaveBeenCalledTimes(1);
    const call = mockAcpSendMessage.mock.calls[0];
    expect(call).toEqual([sessionId, "hi"]);
  });
});
