import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { StatusBar } from "@/features/status/ui/StatusBar";

const baseProps = {
  connectionStatus: "connected" as const,
  modelName: "Claude Opus 4.7",
  contextFolder: "Default",
  mcpCount: 0,
  sessionCount: 0,
  skillsCount: 0,
};

describe("StatusBar", () => {
  it("renders the connection dot as the first item", () => {
    render(<StatusBar {...baseProps} />);
    const bar = screen.getByTestId("status-bar");
    const items = within(bar).getAllByTestId(/status-item-/);
    expect(items[0]).toHaveAttribute("data-testid", "status-item-connection");
    expect(within(items[0]).getByTestId("connection-dot")).toBeInTheDocument();
  });

  it("renders 6 items in the spec order", () => {
    render(<StatusBar {...baseProps} />);
    const items = within(screen.getByTestId("status-bar")).getAllByTestId(
      /status-item-/,
    );
    expect(items.map((el) => el.getAttribute("data-testid"))).toEqual([
      "status-item-connection",
      "status-item-model",
      "status-item-folder",
      "status-item-mcp",
      "status-item-sessions",
      "status-item-skills",
    ]);
  });

  it("shows the active model name", () => {
    render(<StatusBar {...baseProps} modelName="Claude Sonnet 4.6" />);
    expect(screen.getByTestId("status-item-model")).toHaveTextContent(
      "Claude Sonnet 4.6",
    );
  });

  it("shows '—' for model when no active session", () => {
    render(<StatusBar {...baseProps} modelName={undefined} />);
    expect(screen.getByTestId("status-item-model")).toHaveTextContent("—");
  });

  it("shows the context folder, MCP count, session count, and skills count", () => {
    render(
      <StatusBar
        {...baseProps}
        contextFolder="Default"
        mcpCount={3}
        sessionCount={12}
        skillsCount={7}
      />,
    );
    expect(screen.getByTestId("status-item-folder")).toHaveTextContent(
      "Default",
    );
    expect(screen.getByTestId("status-item-mcp")).toHaveTextContent("3");
    expect(screen.getByTestId("status-item-sessions")).toHaveTextContent("12");
    expect(screen.getByTestId("status-item-skills")).toHaveTextContent("7");
  });
});
