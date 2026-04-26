import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/shared/api/acpConnection", () => ({
  getClient: vi.fn(() => new Promise(() => {})),
}));

import { AppShell } from "@/app/AppShell";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useToastStore } from "@/features/toasts/toastStore";
import {
  DRAFT_TAB_PREFIX,
  useTabsStore,
} from "@/features/tabs/stores/tabsStore";

describe("AppShell", () => {
  beforeEach(() => {
    useChatSessionStore.setState({ sessions: [], activeSessionId: null });
    useToastStore.setState({ toasts: [] });
    useTabsStore.setState({ openIds: [], activeId: null });
    localStorage.clear();
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
    // Session still in history
    expect(screen.getByTestId("session-row-abc")).toBeInTheDocument();
  });
});
