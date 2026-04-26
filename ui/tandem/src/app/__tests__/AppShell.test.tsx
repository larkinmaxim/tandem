import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/shared/api/acpConnection", () => ({
  getClient: vi.fn(() => new Promise(() => {})),
}));

import { AppShell } from "@/app/AppShell";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useToastStore } from "@/features/toasts/toastStore";

describe("AppShell", () => {
  beforeEach(() => {
    useChatSessionStore.setState({ sessions: [], activeSessionId: null });
    useToastStore.setState({ toasts: [] });
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
});
