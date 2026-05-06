import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  BugReportModal,
  buildIssueUrl,
  MAX_DESCRIPTION_LENGTH,
} from "../BugReportModal";

const mockOpenUrl = vi.fn().mockResolvedValue(undefined);
const mockInvoke = vi.fn();
const mockToast = vi.fn();
const mockRevealInFileManager = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => mockOpenUrl(...args),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

vi.mock("@/shared/lib/fileManager", () => ({
  revealInFileManager: (...args: unknown[]) => mockRevealInFileManager(...args),
}));

vi.mock("@/shared/lib/platform", () => ({
  getPlatform: () => "linux",
}));

let mockActiveSessionId: string | null = null;
vi.mock("@/features/chat/stores/chatSessionStore", () => ({
  useChatSessionStore: (selector: (s: { activeSessionId: string | null }) => unknown) =>
    selector({ activeSessionId: mockActiveSessionId }),
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

describe("BugReportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveSessionId = null;
    mockInvoke.mockResolvedValue({
      zipPath: "/tmp/tandem-bug-test.zip",
      manifest: "## Environment\n- App version: 0.1.0",
    });
  });

  it("renders when open", () => {
    render(<BugReportModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Report a Bug")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<BugReportModal {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("title validation", () => {
    it("disables submit when title is empty", () => {
      render(<BugReportModal {...defaultProps} />);
      const submitButton = screen.getByRole("button", {
        name: /file on github/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("disables submit when trimmed title has fewer than 3 characters", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText(/brief summary/i);
      await user.type(titleInput, "ab");
      const submitButton = screen.getByRole("button", {
        name: /file on github/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("shows validation message when title is non-empty but too short", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText(/brief summary/i);
      await user.type(titleInput, "ab");
      expect(
        screen.getByText(/title must be at least 3 characters/i),
      ).toBeInTheDocument();
    });

    it("enables submit when title has 3+ characters", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText(/brief summary/i);
      await user.type(titleInput, "abc");
      const submitButton = screen.getByRole("button", {
        name: /file on github/i,
      });
      expect(submitButton).toBeEnabled();
    });
  });

  describe("submit flow", () => {
    it("invokes bundle_bug_report and opens URL on submit", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<BugReportModal open={true} onOpenChange={onOpenChange} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "My bug title",
      );
      await user.type(
        screen.getByPlaceholderText(/what were you doing/i),
        "It broke",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("bundle_bug_report", {
          screenshots: [],
        });
      });

      await waitFor(() => {
        expect(mockOpenUrl).toHaveBeenCalledTimes(1);
      });

      const calledUrl = mockOpenUrl.mock.calls[0][0] as string;
      expect(calledUrl).toContain(
        "https://github.com/larkinmaxim/tandem/issues/new",
      );
      expect(calledUrl).toContain("title=My+bug+title");
      expect(calledUrl).toContain("It+broke");
    });

    it("closes modal after successful submit", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<BugReportModal open={true} onOpenChange={onOpenChange} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("shows spinner during submit", async () => {
      let resolveInvoke: (value: unknown) => void;
      mockInvoke.mockReturnValue(
        new Promise((resolve) => {
          resolveInvoke = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      expect(screen.getByText(/preparing bundle/i)).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();

      resolveInvoke!({
        zipPath: "/tmp/test.zip",
        manifest: "test",
      });

      await waitFor(() => {
        expect(mockOpenUrl).toHaveBeenCalled();
      });
    });
  });

  describe("error handling", () => {
    it("shows error and retry button on invoke failure", async () => {
      mockInvoke.mockRejectedValue(new Error("disk full"));
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(screen.getByText(/disk full/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeInTheDocument();
    });

    it("modal stays open on error", async () => {
      mockInvoke.mockRejectedValue(new Error("failed"));
      const onOpenChange = vi.fn();
      const user = userEvent.setup();
      render(<BugReportModal open={true} onOpenChange={onOpenChange} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it("retry re-runs submission", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("temporary failure"));
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /retry/i }),
        ).toBeInTheDocument();
      });

      const callsBefore = mockInvoke.mock.calls.filter(
        (c) => c[0] === "bundle_bug_report",
      ).length;

      mockInvoke.mockResolvedValueOnce({
        zipPath: "/tmp/test.zip",
        manifest: "test",
      });

      await user.click(screen.getByRole("button", { name: /retry/i }));

      await waitFor(() => {
        const callsAfter = mockInvoke.mock.calls.filter(
          (c) => c[0] === "bundle_bug_report",
        ).length;
        expect(callsAfter).toBe(callsBefore + 1);
      });
    });
  });

  describe("paste handler", () => {
    it("handles image paste by preventing default and adding screenshot", async () => {
      render(<BugReportModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/what were you doing/i);

      const imageBlob = new Blob(["fake-png-data"], { type: "image/png" });
      const file = new File([imageBlob], "screenshot.png", {
        type: "image/png",
      });

      const clipboardData = {
        items: [
          {
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      };

      const pasteEvent = new Event("paste", { bubbles: true });
      Object.defineProperty(pasteEvent, "clipboardData", {
        value: clipboardData,
      });
      Object.defineProperty(pasteEvent, "preventDefault", {
        value: vi.fn(),
      });

      textarea.dispatchEvent(pasteEvent);

      await waitFor(() => {
        expect(screen.getByText(/screenshot-1/)).toBeInTheDocument();
      });
    });

    it("falls through for non-image paste", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/what were you doing/i);

      await user.click(textarea);
      await user.paste("some text");

      expect(textarea).toHaveValue("some text");
      expect(screen.queryByText(/screenshot-/)).not.toBeInTheDocument();
    });

    it("rejects images > 10MB", async () => {
      render(<BugReportModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/what were you doing/i);

      const largeBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], {
        type: "image/png",
      });
      const file = new File([largeBlob], "huge.png", { type: "image/png" });

      const clipboardData = {
        items: [
          {
            type: "image/png",
            getAsFile: () => file,
          },
        ],
      };

      const pasteEvent = new Event("paste", { bubbles: true });
      Object.defineProperty(pasteEvent, "clipboardData", {
        value: clipboardData,
      });
      Object.defineProperty(pasteEvent, "preventDefault", {
        value: vi.fn(),
      });

      textarea.dispatchEvent(pasteEvent);

      await waitFor(() => {
        expect(screen.getByText(/too large/i)).toBeInTheDocument();
      });
    });

    it("supports multiple pasted images", async () => {
      render(<BugReportModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/what were you doing/i);

      for (let i = 0; i < 2; i++) {
        const imageBlob = new Blob(["fake-data"], { type: "image/png" });
        const file = new File([imageBlob], `screenshot${i}.png`, {
          type: "image/png",
        });

        const clipboardData = {
          items: [
            {
              type: "image/png",
              getAsFile: () => file,
            },
          ],
        };

        const pasteEvent = new Event("paste", { bubbles: true });
        Object.defineProperty(pasteEvent, "clipboardData", {
          value: clipboardData,
        });
        Object.defineProperty(pasteEvent, "preventDefault", {
          value: vi.fn(),
        });

        textarea.dispatchEvent(pasteEvent);
      }

      await waitFor(() => {
        expect(screen.getByText(/screenshot-1/)).toBeInTheDocument();
        expect(screen.getByText(/screenshot-2/)).toBeInTheDocument();
      });
    });
  });

  describe("description truncation", () => {
    it("shows truncation notice when description exceeds max length", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/what were you doing/i);

      const longText = "x".repeat(MAX_DESCRIPTION_LENGTH + 100);
      await user.click(textarea);
      // Use fireEvent for efficiency with large strings
      await userEvent.paste(longText);

      await waitFor(() => {
        expect(screen.getByText(/will be truncated/i)).toBeInTheDocument();
      });
    });
  });

  describe("cancel", () => {
    it("closes modal on cancel", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<BugReportModal open={true} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe("success toast", () => {
    it("shows toast after successful submit", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledTimes(1);
      });

      const [message, options] = mockToast.mock.calls[0];
      expect(message).toContain("Bug bundle saved");
      expect(options.duration).toBe(Infinity);
      expect(options.action.label).toBe("Reveal in File Manager");
      expect(options.cancel.label).toBe("Copy path");
    });

    it("reveal action invokes fileManager", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      const [, options] = mockToast.mock.calls[0];
      options.action.onClick();

      expect(mockRevealInFileManager).toHaveBeenCalledWith(
        "/tmp/tandem-bug-test.zip",
      );
    });

    it("shows browser-failed toast when openUrl rejects", async () => {
      mockOpenUrl.mockRejectedValueOnce(new Error("no browser"));
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledTimes(1);
      });

      const [message] = mockToast.mock.calls[0];
      expect(message).toContain("Couldn't open browser");
    });
  });

  describe("session ID passthrough", () => {
    it("passes activeSessionId to bundle_bug_report when session is active", async () => {
      mockActiveSessionId = "sess-abc-123";
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        const bundleCalls = mockInvoke.mock.calls.filter(
          (c) => c[0] === "bundle_bug_report",
        );
        expect(bundleCalls).toHaveLength(1);
        expect(bundleCalls[0][1]).toEqual({
          screenshots: [],
          sessionId: "sess-abc-123",
        });
      });
    });

    it("omits sessionId when no active session", async () => {
      mockActiveSessionId = null;
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);

      await user.type(
        screen.getByPlaceholderText(/brief summary/i),
        "Bug title",
      );
      await user.click(
        screen.getByRole("button", { name: /file on github/i }),
      );

      await waitFor(() => {
        const bundleCalls = mockInvoke.mock.calls.filter(
          (c) => c[0] === "bundle_bug_report",
        );
        expect(bundleCalls).toHaveLength(1);
        expect(bundleCalls[0][1].sessionId).toBeUndefined();
      });
    });
  });

  describe("buildIssueUrl", () => {
    it("includes manifest in body", () => {
      const url = buildIssueUrl("Bug", "Steps", "## Environment\n- v1");
      expect(url).toContain("title=Bug");
      expect(url).toContain("Steps");
      expect(url).toContain("Environment");
    });

    it("omits body when both description and manifest are empty", () => {
      const url = buildIssueUrl("Bug", "", "");
      expect(url).toBe(
        "https://github.com/larkinmaxim/tandem/issues/new?title=Bug",
      );
    });

    it("includes manifest even without description", () => {
      const url = buildIssueUrl("Bug", "", "## Env");
      expect(url).toContain("body=%23%23+Env");
    });
  });
});
