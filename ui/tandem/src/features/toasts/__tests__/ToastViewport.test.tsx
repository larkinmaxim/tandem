import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useToastStore } from "@/features/toasts/toastStore";
import { ToastViewport } from "@/features/toasts/ToastViewport";

describe("ToastViewport", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("renders nothing when there are no toasts", () => {
    render(<ToastViewport />);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("renders a toast when one is added to the store", () => {
    render(<ToastViewport />);
    act(() => {
      useToastStore.getState().addToast("Email — coming soon");
    });
    expect(screen.getByText("Email — coming soon")).toBeInTheDocument();
  });

  it("removes the toast from the DOM when dismissed via the close button", async () => {
    const user = userEvent.setup();
    render(<ToastViewport />);
    act(() => {
      useToastStore.getState().addToast("Settings — coming soon");
    });
    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(
      screen.queryByText("Settings — coming soon"),
    ).not.toBeInTheDocument();
  });
});
