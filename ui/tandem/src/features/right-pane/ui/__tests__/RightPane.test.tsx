import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RightPane } from "@/features/right-pane/ui/RightPane";

describe("RightPane", () => {
  it("renders at 44px when collapsed", () => {
    render(<RightPane collapsed={true} onToggleCollapsed={() => {}} />);
    const pane = screen.getByTestId("zone-right-pane");
    expect(pane).toHaveAttribute("data-collapsed", "true");
    expect(pane).toHaveStyle({ width: "44px" });
  });

  it("renders at 320px when expanded", () => {
    render(<RightPane collapsed={false} onToggleCollapsed={() => {}} />);
    const pane = screen.getByTestId("zone-right-pane");
    expect(pane).toHaveAttribute("data-collapsed", "false");
    expect(pane).toHaveStyle({ width: "320px" });
  });

  it("clicking the toggle button calls onToggleCollapsed", async () => {
    const user = userEvent.setup();
    const onToggleCollapsed = vi.fn();
    render(
      <RightPane
        collapsed={true}
        onToggleCollapsed={onToggleCollapsed}
      />,
    );
    await user.click(screen.getByTestId("right-pane-toggle"));
    expect(onToggleCollapsed).toHaveBeenCalledOnce();
  });

  it("expanded view shows 'Notes coming in v1.4' placeholder", () => {
    render(<RightPane collapsed={false} onToggleCollapsed={() => {}} />);
    expect(screen.getByTestId("zone-right-pane")).toHaveTextContent(
      "Notes coming in v1.4",
    );
  });

  it("collapsed view does not show the placeholder text", () => {
    render(<RightPane collapsed={true} onToggleCollapsed={() => {}} />);
    expect(screen.getByTestId("zone-right-pane")).not.toHaveTextContent(
      "Notes coming in v1.4",
    );
  });
});
