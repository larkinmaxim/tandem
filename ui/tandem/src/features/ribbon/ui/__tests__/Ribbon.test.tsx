import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Ribbon } from "@/features/ribbon/ui/Ribbon";
import { useToastStore } from "@/features/toasts/toastStore";

describe("Ribbon", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders 5 app slots in order: chat, email, calendar, projects, editor", () => {
    render(<Ribbon activeApp="chat" onActivate={() => {}} />);
    const apps = within(screen.getByTestId("ribbon-apps")).getAllByRole(
      "button",
    );
    const ids = apps.map((b) => b.getAttribute("data-app-id"));
    expect(ids).toEqual(["chat", "email", "calendar", "projects", "editor"]);
  });

  it("renders Plugins and Settings buttons in the footer", () => {
    render(<Ribbon activeApp="chat" onActivate={() => {}} />);
    const footer = within(screen.getByTestId("ribbon-footer"));
    expect(footer.getByRole("button", { name: /plugin/i })).toBeInTheDocument();
    expect(footer.getByRole("button", { name: /settings/i })).toBeInTheDocument();
  });

  it("marks the active app with data-active=true and the others false", () => {
    render(<Ribbon activeApp="chat" onActivate={() => {}} />);
    expect(screen.getByTestId("ribbon-app-chat")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByTestId("ribbon-app-email")).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("clicking the live Chat slot calls onActivate('chat')", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<Ribbon activeApp="email" onActivate={onActivate} />);
    await user.click(screen.getByTestId("ribbon-app-chat"));
    expect(onActivate).toHaveBeenCalledWith("chat");
  });

  it("clicking a non-live slot fires '<Label> — coming soon' toast and does NOT call onActivate", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(<Ribbon activeApp="chat" onActivate={onActivate} />);
    await user.click(screen.getByTestId("ribbon-app-email"));
    expect(onActivate).not.toHaveBeenCalled();
    expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual([
      "Email — coming soon",
    ]);
  });

  it("clicking Plugins fires a coming-soon toast", async () => {
    const user = userEvent.setup();
    render(<Ribbon activeApp="chat" onActivate={() => {}} />);
    await user.click(screen.getByTestId("ribbon-plugins"));
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/coming soon/i);
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/plugin/i);
  });

  it("clicking Settings fires a coming-soon toast", async () => {
    const user = userEvent.setup();
    render(<Ribbon activeApp="chat" onActivate={() => {}} />);
    await user.click(screen.getByTestId("ribbon-settings"));
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/coming soon/i);
    expect(useToastStore.getState().toasts[0]?.message).toMatch(/settings/i);
  });

  it("each slot has a tooltip with the label, suffixed with '(coming soon)' for non-live", () => {
    render(<Ribbon activeApp="chat" onActivate={() => {}} />);
    expect(screen.getByTestId("ribbon-app-chat")).toHaveAttribute(
      "title",
      "Chat",
    );
    expect(screen.getByTestId("ribbon-app-email")).toHaveAttribute(
      "title",
      "Email (coming soon)",
    );
  });
});
