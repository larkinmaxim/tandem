import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LeftPane } from "@/features/left-pane/ui/LeftPane";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";

const seedSessions = (
  titles: string[] = ["Onboarding doc", "Bug triage", "Refactor plan"],
) => {
  useChatSessionStore.setState({
    sessions: titles.map((title, i) => ({
      id: `s${i}`,
      title,
      createdAt: "",
      updatedAt: "",
      messageCount: 0,
    })),
    activeSessionId: null,
  });
};

const noopProps = {
  collapsed: false,
  onToggleCollapsed: () => {},
  activeSection: "chat" as const,
  onSectionChange: () => {},
  onNewChat: () => {},
};

describe("LeftPane", () => {
  beforeEach(() => {
    useChatSessionStore.setState({ sessions: [], activeSessionId: null });
  });

  it("renders at 280px when expanded", () => {
    render(<LeftPane {...noopProps} collapsed={false} />);
    const pane = screen.getByTestId("zone-left-pane");
    expect(pane).toHaveAttribute("data-collapsed", "false");
    expect(pane).toHaveStyle({ width: "280px" });
  });

  it("renders at 52px when collapsed", () => {
    render(<LeftPane {...noopProps} collapsed={true} />);
    const pane = screen.getByTestId("zone-left-pane");
    expect(pane).toHaveAttribute("data-collapsed", "true");
    expect(pane).toHaveStyle({ width: "52px" });
  });

  it("clicking the toggle button calls onToggleCollapsed", async () => {
    const user = userEvent.setup();
    const onToggleCollapsed = vi.fn();
    render(
      <LeftPane
        {...noopProps}
        collapsed={false}
        onToggleCollapsed={onToggleCollapsed}
      />,
    );
    await user.click(screen.getByTestId("left-pane-toggle"));
    expect(onToggleCollapsed).toHaveBeenCalledOnce();
  });

  it("shows search input and + button when expanded", () => {
    render(<LeftPane {...noopProps} collapsed={false} />);
    expect(screen.getByTestId("left-pane-search")).toBeInTheDocument();
    expect(screen.getByTestId("left-pane-new-chat")).toBeInTheDocument();
  });

  it("hides search input and + button when collapsed", () => {
    render(<LeftPane {...noopProps} collapsed={true} />);
    expect(screen.queryByTestId("left-pane-search")).not.toBeInTheDocument();
    expect(screen.queryByTestId("left-pane-new-chat")).not.toBeInTheDocument();
  });

  it("clicking the + button calls onNewChat", async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();
    render(<LeftPane {...noopProps} onNewChat={onNewChat} />);
    await user.click(screen.getByTestId("left-pane-new-chat"));
    expect(onNewChat).toHaveBeenCalledOnce();
  });

  it("hosts the SectionSwitcher with the active section marked", () => {
    render(<LeftPane {...noopProps} activeSection="memory" />);
    expect(screen.getByTestId("section-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("section-btn-memory")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("clicking a section button propagates onSectionChange", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(
      <LeftPane
        {...noopProps}
        activeSection="chat"
        onSectionChange={onSectionChange}
      />,
    );
    await user.click(screen.getByTestId("section-btn-projects"));
    expect(onSectionChange).toHaveBeenCalledWith("projects");
  });

  it("Chat section: renders the session list from chatSessionStore", () => {
    seedSessions(["Apple plans", "Banana split", "Carrot recipe"]);
    render(<LeftPane {...noopProps} activeSection="chat" />);
    const rows = screen
      .getAllByTestId(/session-row-/)
      .map((el) => el.textContent);
    expect(rows).toEqual(
      expect.arrayContaining(["Apple plans", "Banana split", "Carrot recipe"]),
    );
  });

  it("Chat section: typing in search filters the session list by title (case-insensitive)", async () => {
    const user = userEvent.setup();
    seedSessions(["Apple plans", "Banana split", "Carrot recipe"]);
    render(<LeftPane {...noopProps} activeSection="chat" />);
    await user.type(screen.getByTestId("left-pane-search"), "ban");
    const rows = screen.getAllByTestId(/session-row-/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("Banana split");
  });

  it("Chat section: clearing the search shows all sessions again", async () => {
    const user = userEvent.setup();
    seedSessions(["Apple", "Banana"]);
    render(<LeftPane {...noopProps} activeSection="chat" />);
    const searchInput = screen.getByTestId("left-pane-search");
    await user.type(searchInput, "ban");
    expect(screen.getAllByTestId(/session-row-/)).toHaveLength(1);
    await user.clear(searchInput);
    expect(screen.getAllByTestId(/session-row-/)).toHaveLength(2);
  });

  it("non-Chat section: does not render the session list", () => {
    seedSessions(["A", "B"]);
    render(<LeftPane {...noopProps} activeSection="projects" />);
    expect(screen.queryByTestId(/session-row-/)).not.toBeInTheDocument();
  });

  it("collapsed: does not render the section switcher or session list", () => {
    seedSessions(["A"]);
    render(<LeftPane {...noopProps} collapsed={true} activeSection="chat" />);
    expect(screen.queryByTestId("section-switcher")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/session-row-/)).not.toBeInTheDocument();
  });

  it("Chat section: live updates from chatSessionStore add new rows", () => {
    seedSessions(["Original"]);
    render(<LeftPane {...noopProps} activeSection="chat" />);
    expect(screen.getAllByTestId(/session-row-/)).toHaveLength(1);
    act(() => {
      useChatSessionStore.setState({
        sessions: [
          ...useChatSessionStore.getState().sessions,
          {
            id: "new",
            title: "Added later",
            createdAt: "",
            updatedAt: "",
            messageCount: 0,
          },
        ],
      });
    });
    expect(screen.getAllByTestId(/session-row-/)).toHaveLength(2);
  });
});
