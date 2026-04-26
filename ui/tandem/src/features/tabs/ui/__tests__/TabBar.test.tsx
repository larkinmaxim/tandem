import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TabBar, type TabDescriptor } from "@/features/tabs/ui/TabBar";

const tabs: TabDescriptor[] = [
  { id: "s1", title: "Onboarding doc" },
  { id: "s2", title: "Bug triage" },
];

const noopProps = {
  tabs,
  activeId: "s1",
  onActivate: () => {},
  onClose: () => {},
  onNew: () => {},
};

describe("TabBar", () => {
  it("renders a row at tabbar height", () => {
    render(<TabBar {...noopProps} />);
    expect(screen.getByTestId("tab-bar")).toHaveStyle({
      height: "var(--tabbar-height)",
    });
  });

  it("renders a tab for each open session with its title", () => {
    render(<TabBar {...noopProps} />);
    expect(screen.getByTestId("tab-s1")).toHaveTextContent("Onboarding doc");
    expect(screen.getByTestId("tab-s2")).toHaveTextContent("Bug triage");
  });

  it("marks the active tab with data-active='true'", () => {
    render(<TabBar {...noopProps} activeId="s2" />);
    expect(screen.getByTestId("tab-s1")).toHaveAttribute(
      "data-active",
      "false",
    );
    expect(screen.getByTestId("tab-s2")).toHaveAttribute("data-active", "true");
  });

  it("invokes onActivate when a tab is clicked", async () => {
    const onActivate = vi.fn();
    render(<TabBar {...noopProps} onActivate={onActivate} />);
    await userEvent.click(screen.getByTestId("tab-s2"));
    expect(onActivate).toHaveBeenCalledWith("s2");
  });

  it("invokes onClose (and not onActivate) when the close button is clicked", async () => {
    const onActivate = vi.fn();
    const onClose = vi.fn();
    render(
      <TabBar {...noopProps} onActivate={onActivate} onClose={onClose} />,
    );
    await userEvent.click(screen.getByTestId("tab-close-s2"));
    expect(onClose).toHaveBeenCalledWith("s2");
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("invokes onNew when the + button is clicked", async () => {
    const onNew = vi.fn();
    render(<TabBar {...noopProps} onNew={onNew} />);
    await userEvent.click(screen.getByTestId("tab-new"));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
