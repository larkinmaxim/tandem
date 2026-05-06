import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BugReportModal, buildIssueUrl } from "../BugReportModal";

const mockOpenUrl = vi.fn().mockResolvedValue(undefined);

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => mockOpenUrl(...args),
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

describe("BugReportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it("treats whitespace-only title as too short", async () => {
      const user = userEvent.setup();
      render(<BugReportModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText(/brief summary/i);
      await user.type(titleInput, "   ");
      const submitButton = screen.getByRole("button", {
        name: /file on github/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("submit", () => {
    it("calls opener with expected URL on submit", async () => {
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
        expect(mockOpenUrl).toHaveBeenCalledTimes(1);
      });

      const calledUrl = mockOpenUrl.mock.calls[0][0] as string;
      expect(calledUrl).toContain(
        "https://github.com/larkinmaxim/tandem/issues/new",
      );
      expect(calledUrl).toContain("title=My+bug+title");
      expect(calledUrl).toContain("body=It+broke");
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
  });

  describe("cancel", () => {
    it("closes modal on cancel", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<BugReportModal open={true} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockOpenUrl).not.toHaveBeenCalled();
    });
  });

  describe("buildIssueUrl", () => {
    it("encodes title and description", () => {
      const url = buildIssueUrl("My Bug", "Steps to reproduce");
      expect(url).toBe(
        "https://github.com/larkinmaxim/tandem/issues/new?title=My+Bug&body=Steps+to+reproduce",
      );
    });

    it("omits body param when description is empty", () => {
      const url = buildIssueUrl("My Bug", "");
      expect(url).toBe(
        "https://github.com/larkinmaxim/tandem/issues/new?title=My+Bug",
      );
    });

    it("trims whitespace from title and description", () => {
      const url = buildIssueUrl("  Bug  ", "  desc  ");
      expect(url).toBe(
        "https://github.com/larkinmaxim/tandem/issues/new?title=Bug&body=desc",
      );
    });
  });
});
