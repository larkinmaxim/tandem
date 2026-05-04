import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/shared/api/acpConnection", () => ({
  getClient: vi.fn(() => new Promise(() => {})),
  setNotificationHandler: vi.fn(),
}));

const { mockAcpCreateSession, mockAcpSendMessage, mockResolvePath } =
  vi.hoisted(() => ({
    mockAcpCreateSession: vi.fn(),
    mockAcpSendMessage: vi.fn(),
    mockResolvePath: vi.fn(),
  }));

vi.mock("@/shared/api/acp", async (importActual) => {
  const actual = await importActual<typeof import("@/shared/api/acp")>();
  return {
    ...actual,
    acpCreateSession: mockAcpCreateSession,
    acpSendMessage: mockAcpSendMessage,
  };
});

vi.mock("@/shared/api/pathResolver", () => ({
  resolvePath: mockResolvePath,
}));

import { AppShell } from "@/app/AppShell";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { useToastStore } from "@/features/toasts/toastStore";
import { useAgentStore } from "@/features/agents/stores/agentStore";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";
import {
  DRAFT_TAB_PREFIX,
  useTabsStore,
} from "@/features/tabs/stores/tabsStore";
import { TABS_STORAGE_KEY } from "@/features/tabs/lib/tabPersistence";

function seedTabs(openIds: string[], activeId: string | null) {
  // Persist + setState so the AppShell hydrate effect restores the same shape
  // instead of clobbering test setup with an empty localStorage read.
  localStorage.setItem(
    TABS_STORAGE_KEY,
    JSON.stringify({ openIds, activeId }),
  );
  useTabsStore.setState({ openIds, activeId });
}

describe("AppShell", () => {
  beforeEach(() => {
    useChatSessionStore.setState({ sessions: [], activeSessionId: null });
    useChatStore.setState({ messagesBySession: {}, sessionStateById: {} });
    useToastStore.setState({ toasts: [] });
    useTabsStore.setState({ openIds: [], activeId: null });
    useAgentStore.setState({ personas: [] });
    useProviderInventoryStore.getState().setEntries([
      { providerId: "openai", configured: true, models: [] } as never,
    ]);
    localStorage.clear();
    mockAcpCreateSession.mockReset();
    mockAcpSendMessage.mockReset();
    mockResolvePath.mockReset();
    mockResolvePath.mockResolvedValue({
      path: "/home/test/.goose/artifacts",
    });
    mockAcpSendMessage.mockResolvedValue(undefined);
  });

  it("renders all 5 zones", () => {
    render(<AppShell />);
    expect(screen.getByTestId("zone-ribbon")).toBeInTheDocument();
    expect(screen.getByTestId("zone-left-pane")).toBeInTheDocument();
    expect(screen.getByTestId("zone-main")).toBeInTheDocument();
    expect(screen.getByTestId("zone-right-pane")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
  });

  it("starts with the right pane collapsed at 44px", () => {
    render(<AppShell />);
    const rightPane = screen.getByTestId("zone-right-pane");
    expect(rightPane).toHaveAttribute("data-collapsed", "true");
    expect(rightPane).toHaveStyle({ width: "44px" });
  });

  it("starts with the left pane expanded at 280px", () => {
    render(<AppShell />);
    const leftPane = screen.getByTestId("zone-left-pane");
    expect(leftPane).toHaveAttribute("data-collapsed", "false");
    expect(leftPane).toHaveStyle({ width: "280px" });
  });

  it("uses the design's fixed widths for ribbon, left pane, status bar", () => {
    render(<AppShell />);
    expect(screen.getByTestId("zone-ribbon")).toHaveStyle({ width: "44px" });
    expect(screen.getByTestId("zone-left-pane")).toHaveStyle({
      width: "280px",
    });
    expect(screen.getByTestId("status-bar")).toHaveStyle({
      height: "var(--statusbar-height)",
    });
  });

  it("renders the status bar with the live session count from chatSessionStore", () => {
    act(() => {
      useChatSessionStore.setState({
        sessions: [
          {
            id: "a",
            title: "x",
            createdAt: "",
            updatedAt: "",
            messageCount: 0,
          },
          {
            id: "b",
            title: "y",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
    });
    render(<AppShell />);
    expect(screen.getByTestId("status-item-sessions")).toHaveTextContent("2");
  });

  it("renders the model name from the active session", () => {
    act(() => {
      useChatSessionStore.setState({
        sessions: [
          {
            id: "a",
            title: "x",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
            modelName: "Claude Opus 4.7",
          },
        ],
        activeSessionId: "a",
      });
    });
    render(<AppShell />);
    expect(screen.getByTestId("status-item-model")).toHaveTextContent(
      "Claude Opus 4.7",
    );
  });

  it("falls back to '—' when no active session", () => {
    render(<AppShell />);
    expect(screen.getByTestId("status-item-model")).toHaveTextContent("—");
  });

  it("defaults to the chat section", () => {
    render(<AppShell />);
    expect(screen.getByTestId("zone-main")).toHaveAttribute(
      "data-section",
      "chat",
    );
  });

  it("clicking a section button changes the active section", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("section-btn-projects"));
    expect(screen.getByTestId("zone-main")).toHaveAttribute(
      "data-section",
      "projects",
    );
  });

  it("non-Chat section renders StubBody in the main pane with the correct copy", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("section-btn-workflows"));
    const stub = screen.getByTestId("stub-body");
    expect(stub).toHaveAttribute("data-section", "workflows");
    expect(stub).toHaveTextContent("Workflows is shipping in v1.3.");
  });

  it("Chat section does not render a StubBody in the main pane", () => {
    render(<AppShell />);
    expect(screen.queryByTestId("stub-body")).not.toBeInTheDocument();
  });

  it("clicking a non-live ribbon slot shows a toast in the viewport", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("ribbon-app-email"));
    expect(screen.getByTestId("toast")).toHaveTextContent(
      "Email — coming soon",
    );
  });

  it("clicking the left pane toggle collapses the pane to 52px", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("left-pane-toggle"));
    const leftPane = screen.getByTestId("zone-left-pane");
    expect(leftPane).toHaveAttribute("data-collapsed", "true");
    expect(leftPane).toHaveStyle({ width: "52px" });
  });

  it("clicking the right pane toggle expands the pane to 320px", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("right-pane-toggle"));
    const rightPane = screen.getByTestId("zone-right-pane");
    expect(rightPane).toHaveAttribute("data-collapsed", "false");
    expect(rightPane).toHaveStyle({ width: "320px" });
  });

  it("ribbon marks Chat as active", () => {
    render(<AppShell />);
    expect(screen.getByTestId("ribbon-app-chat")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("renders the TabBar in the main pane on the chat section", () => {
    render(<AppShell />);
    expect(screen.getByTestId("tab-bar")).toBeInTheDocument();
  });

  it("does not render the TabBar when a stub section is active", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("section-btn-projects"));
    expect(screen.queryByTestId("tab-bar")).not.toBeInTheDocument();
  });

  it("clicking a session row in the LeftPane opens it as a tab", async () => {
    const user = userEvent.setup();
    act(() => {
      useChatSessionStore.setState({
        sessions: [
          {
            id: "abc",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
    });
    render(<AppShell />);
    await user.click(screen.getByTestId("session-row-abc"));
    expect(screen.getByTestId("tab-abc")).toHaveTextContent("Existing chat");
    expect(screen.getByTestId("tab-abc")).toHaveAttribute("data-active", "true");
  });

  it("clicking the same session row again does not duplicate the tab", async () => {
    const user = userEvent.setup();
    act(() => {
      useChatSessionStore.setState({
        sessions: [
          {
            id: "abc",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
          {
            id: "def",
            title: "Other chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
    });
    render(<AppShell />);
    await user.click(screen.getByTestId("session-row-abc"));
    await user.click(screen.getByTestId("session-row-def"));
    await user.click(screen.getByTestId("session-row-abc"));
    // Both tabs present; abc focused
    expect(screen.getAllByTestId(/^tab-(abc|def)$/)).toHaveLength(2);
    expect(screen.getByTestId("tab-abc")).toHaveAttribute("data-active", "true");
  });

  it("clicking the LeftPane + button opens a new draft tab synchronously titled 'New Chat'", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("left-pane-new-chat"));

    const { openIds, activeId } = useTabsStore.getState();
    expect(openIds).toHaveLength(1);
    expect(openIds[0].startsWith(DRAFT_TAB_PREFIX)).toBe(true);
    expect(activeId).toBe(openIds[0]);
    expect(screen.getByTestId(`tab-${openIds[0]}`)).toHaveTextContent(
      "New Chat",
    );
  });

  it("clicking the TabBar + button also opens a new draft tab", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("tab-new"));

    const { openIds } = useTabsStore.getState();
    expect(openIds).toHaveLength(1);
    expect(openIds[0].startsWith(DRAFT_TAB_PREFIX)).toBe(true);
  });

  it("does not call any ACP API when creating a new tab (drafts are local-only)", async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByTestId("left-pane-new-chat"));
    // chatSessionStore stays empty — no real session was created
    expect(useChatSessionStore.getState().sessions).toHaveLength(0);
  });

  describe("chat empty state", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows the empty-state greeting in the main pane when the active tab is a draft with no messages", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 27, 10, 0, 0)); // 10:00 AM local
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      const empty = screen.getByTestId("chat-empty-state");
      expect(empty).toBeInTheDocument();
      expect(empty).toHaveTextContent(/Good morning/i);
      expect(empty).toHaveTextContent(/What are we working on\?/i);
    });

    it("uses 'afternoon' between 12:00 and 17:59", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 27, 14, 0, 0));
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      expect(screen.getByTestId("chat-empty-state")).toHaveTextContent(
        /Good afternoon/i,
      );
    });

    it("uses 'evening' from 18:00 onward", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 27, 20, 0, 0));
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      expect(screen.getByTestId("chat-empty-state")).toHaveTextContent(
        /Good evening/i,
      );
    });

    it("renders a multi-line textarea composer inside the empty state", () => {
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      const composer = screen.getByTestId("chat-composer-input");
      expect(composer.tagName).toBe("TEXTAREA");
    });

    it("renders the timeline (no empty state) when the active tab has messages", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 2,
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
            {
              id: "a1",
              role: "assistant",
              created: 2,
              content: [{ type: "text", text: "hello back" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
      });

      render(<AppShell />);

      expect(screen.queryByTestId("chat-empty-state")).not.toBeInTheDocument();
      const timeline = screen.getByTestId("chat-timeline");
      expect(timeline).toHaveTextContent("hi");
      expect(timeline).toHaveTextContent("hello back");
    });

    it("renders user initials on user messages and an assistant icon on assistant messages", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 2,
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
            {
              id: "a1",
              role: "assistant",
              created: 2,
              content: [{ type: "text", text: "hello back" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
      });

      render(<AppShell />);

      const userAvatar = screen.getByTestId("chat-avatar-u1");
      expect(userAvatar).toHaveAttribute("data-role", "user");
      // DEFAULT_USER_NAME = "Maxim" → initials "M"
      expect(userAvatar).toHaveTextContent("M");

      const assistantAvatar = screen.getByTestId("chat-avatar-a1");
      expect(assistantAvatar).toHaveAttribute("data-role", "assistant");
      // Assistant avatar is an icon (svg), not text
      expect(assistantAvatar.querySelector("svg")).toBeInTheDocument();
    });

    it("shows a typing indicator while the assistant is generating", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
        sessionStateById: {
          "sess-1": {
            chatState: "streaming",
            tokenState: {
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              accumulatedInput: 0,
              accumulatedOutput: 0,
              accumulatedTotal: 0,
              contextLimit: 0,
            },
            hasUsageSnapshot: false,
            streamingMessageId: null,
            pendingAssistantProviderId: null,
            error: null,
            hasUnread: false,
          },
        },
      });

      render(<AppShell />);

      expect(screen.getByTestId("chat-typing-indicator")).toBeInTheDocument();
    });

    it("hides the typing indicator when chatState is idle", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
      });

      render(<AppShell />);

      expect(
        screen.queryByTestId("chat-typing-indicator"),
      ).not.toBeInTheDocument();
    });

    it("first send from a draft tab creates a session, replaces the tab id, and hard-swaps to the timeline", async () => {
      const user = userEvent.setup();
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      mockAcpCreateSession.mockResolvedValue({
        sessionId: "real-session-id",
      });

      render(<AppShell />);

      const input = screen.getByTestId("chat-composer-input");
      await user.type(input, "hello world");
      await user.keyboard("{Enter}");

      // Empty state gone, timeline showing the user's message
      await waitFor(
        () => {
          expect(mockAcpCreateSession).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
      await waitFor(
        () => {
          expect(screen.queryByTestId("chat-empty-state")).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
      const timeline = screen.getByTestId("chat-timeline");
      expect(timeline).toHaveTextContent("hello world");

      // Tab swapped to real session id
      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual(["real-session-id"]);
      expect(activeId).toBe("real-session-id");

      // Session in store, message persisted
      const sessions = useChatSessionStore.getState().sessions;
      expect(sessions.map((s) => s.id)).toContain("real-session-id");
      const msgs =
        useChatStore.getState().messagesBySession["real-session-id"] ?? [];
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe("user");

      // ACP prompt sent
      expect(mockAcpSendMessage).toHaveBeenCalledWith(
        "real-session-id",
        "hello world",
      );
    });

    it("includes attached image in the ACP prompt payload as options.images", async () => {
      const user = userEvent.setup();
      const draftId = `${DRAFT_TAB_PREFIX}img`;
      seedTabs([draftId], draftId);

      mockAcpCreateSession.mockResolvedValue({
        sessionId: "real-session-img",
      });

      render(<AppShell />);

      const fileInput = screen.getByTestId(
        "chat-composer-attach-input",
      ) as HTMLInputElement;
      const file = new File(["fake-png-bytes"], "diagram.png", {
        type: "image/png",
      });
      await user.upload(fileInput, file);
      await screen.findByTestId("chat-composer-attachment-chip");

      const input = screen.getByTestId("chat-composer-input");
      await user.type(input, "look at this");
      await user.keyboard("{Enter}");

      await waitFor(
        () => {
          expect(mockAcpSendMessage).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      const [sessionId, text, options] = mockAcpSendMessage.mock.calls[0];
      expect(sessionId).toBe("real-session-img");
      expect(text).toBe("look at this");
      expect(options).toBeDefined();
      expect(options.images).toHaveLength(1);
      const [data, mimeType] = options.images[0];
      expect(typeof data).toBe("string");
      expect(data.length).toBeGreaterThan(0);
      expect(mimeType).toBe("image/png");
    });
  });

  it("clicking a tab close button removes the tab but keeps the session in history", async () => {
    const user = userEvent.setup();
    act(() => {
      useChatSessionStore.setState({
        sessions: [
          {
            id: "abc",
            title: "Existing chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
    });
    render(<AppShell />);
    await user.click(screen.getByTestId("session-row-abc"));
    expect(screen.getByTestId("tab-abc")).toBeInTheDocument();
    await user.click(screen.getByTestId("tab-close-abc"));
    expect(screen.queryByTestId("tab-abc")).not.toBeInTheDocument();
    expect(screen.getByTestId("session-row-abc")).toBeInTheDocument();
  });

  describe("persona name on assistant messages (slice 9)", () => {
    it("renders 'Tandem' as fallback persona name on assistant messages", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 2,
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
            {
              id: "a1",
              role: "assistant",
              created: 2,
              content: [{ type: "text", text: "hello" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
      });

      render(<AppShell />);

      const personaHeader = screen.getByTestId("chat-message-persona-a1");
      expect(personaHeader).toHaveTextContent("Tandem");
    });

    it("renders the persona display name when session has a personaId and agentStore has a matching persona", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 2,
            personaId: "persona-abc",
          },
        ],
      });
      useAgentStore.setState({
        personas: [
          {
            id: "persona-abc",
            displayName: "Code Wizard",
            systemPrompt: "",
            isBuiltin: true,
            createdAt: "",
            updatedAt: "",
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
            {
              id: "a1",
              role: "assistant",
              created: 2,
              content: [{ type: "text", text: "hello" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
      });

      render(<AppShell />);

      const personaHeader = screen.getByTestId("chat-message-persona-a1");
      expect(personaHeader).toHaveTextContent("Code Wizard");
    });

    it("does not render a persona header on user messages", () => {
      seedTabs(["sess-1"], "sess-1");
      useChatSessionStore.setState({
        sessions: [
          {
            id: "sess-1",
            title: "Chat",
            createdAt: "",
            updatedAt: "",
            messageCount: 1,
          },
        ],
      });
      useChatStore.setState({
        messagesBySession: {
          "sess-1": [
            {
              id: "u1",
              role: "user",
              created: 1,
              content: [{ type: "text", text: "hi" }],
              metadata: { userVisible: true, agentVisible: true },
            },
          ],
        },
      });

      render(<AppShell />);

      expect(
        screen.queryByTestId("chat-message-persona-u1"),
      ).not.toBeInTheDocument();
    });
  });

  describe("composer footer chips (slice 10)", () => {
    it("renders context folder, token counter, and MCP count chips in the composer footer", () => {
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      expect(
        screen.getByTestId("chat-composer-context-folder"),
      ).toHaveTextContent("Default");
      expect(
        screen.getByTestId("chat-composer-token-counter"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("chat-composer-mcp-count"),
      ).toBeInTheDocument();
    });
  });

  describe("providers banner (slice 11)", () => {
    it("renders the ProvidersBanner when no providers have configured: true", () => {
      useProviderInventoryStore.getState().setEntries([]);
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      const banner = screen.getByTestId("providers-banner");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(
        "No providers configured. Open goose2 to set up an API key, then restart Tandem.",
      );
    });

    it("does not render the banner when a configured provider exists", () => {
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      expect(screen.queryByTestId("providers-banner")).not.toBeInTheDocument();
    });

    it("disables the composer when no providers are configured", () => {
      useProviderInventoryStore.getState().setEntries([]);
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      const textarea = screen.getByTestId(
        "chat-composer-input",
      ) as HTMLTextAreaElement;
      expect(textarea.disabled).toBe(true);
    });

    it("enables the composer when providers are configured", () => {
      const draftId = `${DRAFT_TAB_PREFIX}abc`;
      seedTabs([draftId], draftId);

      render(<AppShell />);

      const textarea = screen.getByTestId(
        "chat-composer-input",
      ) as HTMLTextAreaElement;
      expect(textarea.disabled).toBe(false);
    });
  });
});
