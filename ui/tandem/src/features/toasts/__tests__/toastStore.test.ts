import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { useToastStore } from "@/features/toasts/toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("addToast adds a toast with the given message", () => {
    useToastStore.getState().addToast("Email — coming soon");
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Email — coming soon");
  });

  it("addToast assigns a unique id to each toast", () => {
    const { addToast } = useToastStore.getState();
    addToast("a");
    addToast("b");
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it("dismissToast removes the toast with that id", () => {
    useToastStore.getState().addToast("first");
    useToastStore.getState().addToast("second");
    const [firstToast] = useToastStore.getState().toasts;
    useToastStore.getState().dismissToast(firstToast.id);
    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe("second");
  });

  it("auto-dismisses a toast after the default duration", () => {
    vi.useFakeTimers();
    useToastStore.getState().addToast("transient");
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
