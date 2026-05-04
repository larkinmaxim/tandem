import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { SessionNotification } from "@agentclientprotocol/sdk";
import type { ProviderInventoryEntryDto } from "@aaif/goose-sdk";

const { mockSetNotificationHandler, mockGetClient, mockGetProviderInventory } =
  vi.hoisted(() => ({
    mockSetNotificationHandler: vi.fn(),
    mockGetClient: vi.fn(),
    mockGetProviderInventory: vi.fn(),
  }));

vi.mock("@/shared/api/acpConnection", () => ({
  setNotificationHandler: mockSetNotificationHandler,
  getClient: mockGetClient,
}));

vi.mock("@/shared/api/acp", async (importActual) => {
  const actual = await importActual<typeof import("@/shared/api/acp")>();
  return {
    ...actual,
    acpListSessions: vi.fn(async () => []),
  };
});

vi.mock("@/features/providers/api/inventory", () => ({
  getProviderInventory: mockGetProviderInventory,
}));

import { useAppStartup } from "@/app/hooks/useAppStartup";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";
import {
  registerSession,
  unregisterSession,
} from "@/shared/api/acpSessionTracker";
import type { AcpNotificationHandler } from "@/shared/api/acpConnection";

function makeEntry(
  providerId: string,
  configured: boolean,
): ProviderInventoryEntryDto {
  return {
    providerId,
    providerName: providerId,
    description: "",
    defaultModel: "default",
    configured,
    providerType: "Builtin",
    configKeys: [],
    setupSteps: [],
    supportsRefresh: false,
    refreshing: false,
    models: [],
    stale: false,
  };
}

describe("useAppStartup ACP notification wire-up (slice 7b)", () => {
  beforeEach(() => {
    mockSetNotificationHandler.mockReset();
    mockGetClient.mockReset();
    mockGetClient.mockResolvedValue({});
    mockGetProviderInventory.mockReset();
    mockGetProviderInventory.mockResolvedValue([]);
    useProviderInventoryStore.setState({
      entries: new Map<string, ProviderInventoryEntryDto>(),
      loading: false,
    });
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
    useChatSessionStore.setState({
      sessions: [],
      activeSessionId: null,
      hasHydratedSessions: false,
    });
  });

  afterEach(() => {
    unregisterSession("local-session-7b", "goose-session-7b");
  });

  it("routes a SessionNotification to chatStore.messagesBySession", async () => {
    renderHook(() => useAppStartup());

    await waitFor(() => {
      expect(mockSetNotificationHandler).toHaveBeenCalledTimes(1);
    });

    const handler = mockSetNotificationHandler.mock.calls[0]?.[0] as
      | AcpNotificationHandler
      | undefined;
    expect(handler).toBeDefined();
    expect(typeof handler?.handleSessionNotification).toBe("function");

    registerSession(
      "local-session-7b",
      "goose-session-7b",
      "goose",
      "/tmp/test",
    );

    const notification: SessionNotification = {
      sessionId: "goose-session-7b",
      update: {
        sessionUpdate: "agent_message_chunk",
        messageId: "assistant-msg-1",
        content: { type: "text", text: "hello from agent" },
      },
    } as SessionNotification;

    await handler!.handleSessionNotification(notification);

    const messages =
      useChatStore.getState().messagesBySession["local-session-7b"];
    expect(messages).toBeDefined();
    expect(messages).toHaveLength(1);
    expect(messages?.[0]?.id).toBe("assistant-msg-1");
    expect(messages?.[0]?.role).toBe("assistant");
    const textBlock = messages?.[0]?.content[0];
    expect(textBlock?.type).toBe("text");
    if (textBlock?.type === "text") {
      expect(textBlock.text).toBe("hello from agent");
    }
  });
});

describe("useAppStartup provider inventory load (slice 11)", () => {
  beforeEach(() => {
    mockSetNotificationHandler.mockReset();
    mockGetClient.mockReset();
    mockGetClient.mockResolvedValue({});
    mockGetProviderInventory.mockReset();
    useProviderInventoryStore.setState({
      entries: new Map<string, ProviderInventoryEntryDto>(),
      loading: false,
    });
  });

  it("populates providerInventoryStore from getProviderInventory() on mount", async () => {
    mockGetProviderInventory.mockResolvedValue([
      makeEntry("openai", true),
      makeEntry("anthropic", false),
    ]);

    renderHook(() => useAppStartup());

    await waitFor(() => {
      expect(mockGetProviderInventory).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(useProviderInventoryStore.getState().entries.size).toBe(2);
    });

    const entries = useProviderInventoryStore.getState().entries;
    expect(entries.get("openai")?.configured).toBe(true);
    expect(entries.get("anthropic")?.configured).toBe(false);
  });
});
