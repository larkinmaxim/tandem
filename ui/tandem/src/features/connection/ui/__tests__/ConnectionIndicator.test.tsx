import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ConnectionIndicator } from "@/features/connection/ui/ConnectionIndicator";

describe("ConnectionIndicator", () => {
  it("renders a green dot when connected", () => {
    render(<ConnectionIndicator status="connected" />);
    const dot = screen.getByTestId("connection-dot");
    expect(dot).toHaveStyle({ background: "var(--color-success)" });
  });

  it("renders a yellow dot when connecting", () => {
    render(<ConnectionIndicator status="connecting" />);
    const dot = screen.getByTestId("connection-dot");
    expect(dot).toHaveStyle({ background: "var(--color-warning)" });
  });

  it("renders a red dot with backend-unreachable tooltip when failed", () => {
    render(<ConnectionIndicator status="failed" />);
    const dot = screen.getByTestId("connection-dot");
    expect(dot).toHaveStyle({ background: "var(--color-danger)" });
    expect(dot).toHaveAttribute("title", "Backend unreachable — check that goose serve is running and restart Tandem");
  });

  it("explains the live state via title for screen readers when connected", () => {
    render(<ConnectionIndicator status="connected" />);
    expect(screen.getByTestId("connection-dot")).toHaveAttribute(
      "title",
      "Connected to backend",
    );
  });
});
