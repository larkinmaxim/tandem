import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SectionSwitcher } from "@/features/sections/ui/SectionSwitcher";

describe("SectionSwitcher", () => {
  it("renders 5 buttons in order: chat, projects, memory, workflows, skills", () => {
    render(<SectionSwitcher activeSection="chat" onSectionChange={() => {}} />);
    const buttons = within(
      screen.getByTestId("section-switcher"),
    ).getAllByRole("button");
    const ids = buttons.map((b) => b.getAttribute("data-section-id"));
    expect(ids).toEqual(["chat", "projects", "memory", "workflows", "skills"]);
  });

  it("marks the active section with data-active=true and others false", () => {
    render(
      <SectionSwitcher
        activeSection="workflows"
        onSectionChange={() => {}}
      />,
    );
    expect(screen.getByTestId("section-btn-workflows")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByTestId("section-btn-chat")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("clicking a button calls onSectionChange with that section id", async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();
    render(
      <SectionSwitcher
        activeSection="chat"
        onSectionChange={onSectionChange}
      />,
    );
    await user.click(screen.getByTestId("section-btn-projects"));
    expect(onSectionChange).toHaveBeenCalledWith("projects");
  });

  it("each button has its label as accessible name", () => {
    render(<SectionSwitcher activeSection="chat" onSectionChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Memory" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Workflows" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skills" })).toBeInTheDocument();
  });
});
