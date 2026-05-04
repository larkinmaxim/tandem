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
    expect(onSend).toHaveBeenCalledWith("hello world", []);
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

  it("renders an attach button and a hidden image-only file input", () => {
    render(<Composer />);

    const attachButton = screen.getByTestId("chat-composer-attach");
    expect(attachButton).toBeInTheDocument();
    expect(attachButton).toHaveAttribute("aria-label", "Attach file");

    const fileInput = screen.getByTestId(
      "chat-composer-attach-input",
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe("file");
    expect(fileInput.accept).toMatch(/^image\//);
  });

  it("renders an attachment chip after the user picks an image", async () => {
    const user = userEvent.setup();
    render(<Composer />);
    const fileInput = screen.getByTestId(
      "chat-composer-attach-input",
    ) as HTMLInputElement;

    const file = new File(["fake-png-bytes"], "screenshot.png", {
      type: "image/png",
    });
    await user.upload(fileInput, file);

    const chip = await screen.findByTestId("chat-composer-attachment-chip");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent("screenshot.png");
  });

  it("calls onSend with text and the attachments array on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const fileInput = screen.getByTestId(
      "chat-composer-attach-input",
    ) as HTMLInputElement;
    const file = new File(["fake-png-bytes"], "diagram.png", {
      type: "image/png",
    });
    await user.upload(fileInput, file);
    await screen.findByTestId("chat-composer-attachment-chip");

    const input = screen.getByTestId("chat-composer-input");
    await user.type(input, "look at this");
    await user.keyboard("{Enter}");

    expect(onSend).toHaveBeenCalledTimes(1);
    const [text, attachments] = onSend.mock.calls[0];
    expect(text).toBe("look at this");
    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      name: "diagram.png",
      mimeType: "image/png",
    });
    expect(typeof attachments[0].data).toBe("string");
    expect(attachments[0].data.length).toBeGreaterThan(0);
  });

  it("clears attachments after a successful submit", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const fileInput = screen.getByTestId(
      "chat-composer-attach-input",
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["b"], "shot.png", { type: "image/png" }),
    );
    await screen.findByTestId("chat-composer-attachment-chip");
    const input = screen.getByTestId("chat-composer-input");
    await user.type(input, "go");
    await user.keyboard("{Enter}");

    expect(
      screen.queryByTestId("chat-composer-attachment-chip"),
    ).not.toBeInTheDocument();
  });

  it("renders a read-only context-folder chip in the footer (default 'Default')", () => {
    render(<Composer />);
    const chip = screen.getByTestId("chat-composer-context-folder");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent("Default");
  });

  it("renders the contextFolder prop value in the chip", () => {
    render(<Composer contextFolder="my-project" />);
    expect(screen.getByTestId("chat-composer-context-folder")).toHaveTextContent(
      "my-project",
    );
  });

  it("renders a read-only MCP count chip in the footer (default 0)", () => {
    render(<Composer />);
    const chip = screen.getByTestId("chat-composer-mcp-count");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent("MCP");
    expect(chip).toHaveTextContent("0");
  });

  it("renders the mcpCount prop value in the badge", () => {
    render(<Composer mcpCount={3} />);
    expect(screen.getByTestId("chat-composer-mcp-count")).toHaveTextContent("3");
  });

  it("renders a token-counter chip showing '0' when tokenLimit is unknown", () => {
    render(<Composer />);
    const chip = screen.getByTestId("chat-composer-token-counter");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent("0");
    expect(chip).not.toHaveTextContent("/");
  });

  it("formats the token counter as 'X.Xk / Yk' when limit > 0 (sub-10k uses one decimal)", () => {
    render(<Composer tokenUsed={8420} tokenLimit={200000} />);
    expect(screen.getByTestId("chat-composer-token-counter")).toHaveTextContent(
      "8.4k / 200k",
    );
  });

  it("drops the trailing '.0' from the used side (e.g. 1000 -> '1k')", () => {
    render(<Composer tokenUsed={1000} tokenLimit={200000} />);
    expect(screen.getByTestId("chat-composer-token-counter")).toHaveTextContent(
      "1k / 200k",
    );
  });

  it("renders the used side without a decimal once at or above 10000", () => {
    render(<Composer tokenUsed={12345} tokenLimit={200000} />);
    expect(screen.getByTestId("chat-composer-token-counter")).toHaveTextContent(
      "12k / 200k",
    );
  });

  it("removes an attachment when its remove (×) button is clicked", async () => {
    const user = userEvent.setup();
    render(<Composer />);
    const fileInput = screen.getByTestId(
      "chat-composer-attach-input",
    ) as HTMLInputElement;

    const file = new File(["bytes"], "diagram.png", { type: "image/png" });
    await user.upload(fileInput, file);

    const chip = await screen.findByTestId("chat-composer-attachment-chip");
    const removeButton = chip.querySelector<HTMLButtonElement>(
      '[data-testid="chat-composer-attachment-remove"]',
    );
    expect(removeButton).not.toBeNull();

    await user.click(removeButton as HTMLButtonElement);

    expect(
      screen.queryByTestId("chat-composer-attachment-chip"),
    ).not.toBeInTheDocument();
  });
});
