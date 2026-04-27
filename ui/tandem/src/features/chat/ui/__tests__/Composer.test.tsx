import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Composer } from "@/features/chat/ui/Composer";

describe("Composer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls onSend with the trimmed text when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const input = screen.getByTestId("chat-composer-input");

    await user.type(input, "  hello world  ");
    await user.keyboard("{Enter}");

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("hello world");
  });

  it("clears the input after submitting", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const input = screen.getByTestId(
      "chat-composer-input",
    ) as HTMLTextAreaElement;

    await user.type(input, "hi");
    await user.keyboard("{Enter}");

    expect(input.value).toBe("");
  });

  it("does not call onSend when input is empty", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const input = screen.getByTestId("chat-composer-input");

    input.focus();
    await user.keyboard("{Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend when input is whitespace only", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const input = screen.getByTestId("chat-composer-input");

    await user.type(input, "    ");
    await user.keyboard("{Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });

  it("inserts a newline on Shift+Enter and does not submit", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const input = screen.getByTestId(
      "chat-composer-input",
    ) as HTMLTextAreaElement;

    await user.type(input, "line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(input, "line two");

    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toBe("line one\nline two");
  });
});
