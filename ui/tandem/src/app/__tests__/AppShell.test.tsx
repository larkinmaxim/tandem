import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

vi.mock("@/shared/api/acpConnection", () => ({
  getClient: vi.fn(() => new Promise(() => {})),
}));

import { AppShell } from "@/app/AppShell";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";

describe("AppShell", () => {
  beforeEach(() => {
    useChatSessionStore.setState({ sessions: [], activeSessionId: null });
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
});
