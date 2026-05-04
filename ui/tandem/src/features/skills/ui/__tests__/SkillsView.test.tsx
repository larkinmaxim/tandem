import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { installBackend, resetBackend } from "@/shared/sdk";
import { buildInMemoryBackend } from "@/composition/buildBackend";
import type { Skill } from "@/core/domain";
import { InMemorySkills } from "@/infra/test/InMemorySkills";
import { SkillsView } from "../SkillsView";

const mockSkills: Skill[] = [
  {
    name: "code-review",
    description: "Reviews code",
    instructions: "Review the code...",
    path: "/path",
  },
  {
    name: "test-writer",
    description: "Writes tests",
    instructions: "Write tests...",
    path: "/path",
  },
];

let skillsAdapter: InMemorySkills;

beforeEach(() => {
  skillsAdapter = new InMemorySkills();
  installBackend({
    ...buildInMemoryBackend(),
    skills: skillsAdapter,
  });
});

afterEach(() => {
  resetBackend();
});

describe("SkillsView", () => {
  describe("Rendering", () => {
    it("shows Skills heading and subtitle", async () => {
      render(<SkillsView />);
      expect(screen.getByText("Skills")).toBeInTheDocument();
      expect(
        screen.getByText("Reusable instructions for your AI personas"),
      ).toBeInTheDocument();
    });

    it("shows New Skill and Import buttons", async () => {
      render(<SkillsView />);
      expect(screen.getByText("New Skill")).toBeInTheDocument();
      expect(screen.getByText("Import")).toBeInTheDocument();
    });

    it("shows empty state when no skills exist", async () => {
      render(<SkillsView />);
      await waitFor(() => {
        expect(screen.getByText("No skills yet")).toBeInTheDocument();
      });
      expect(
        screen.getByText("Create a skill or drop a .skill.json file here."),
      ).toBeInTheDocument();
    });

    it("renders skill cards when skills are loaded", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      render(<SkillsView />);
      expect(await screen.findByText("code-review")).toBeInTheDocument();
      expect(screen.getByText("test-writer")).toBeInTheDocument();
      expect(screen.getByText("Reviews code")).toBeInTheDocument();
      expect(screen.getByText("Writes tests")).toBeInTheDocument();
    });
  });

  describe("Search", () => {
    it("filters skills by name when searching", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.type(
        screen.getByPlaceholderText("Search skills by name or description..."),
        "code",
      );

      expect(screen.getByText("code-review")).toBeInTheDocument();
      expect(screen.queryByText("test-writer")).not.toBeInTheDocument();
    });

    it("filters skills by description when searching", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.type(
        screen.getByPlaceholderText("Search skills by name or description..."),
        "Writes tests",
      );

      expect(screen.queryByText("code-review")).not.toBeInTheDocument();
      expect(screen.getByText("test-writer")).toBeInTheDocument();
    });

    it("shows empty state when search has no results", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.type(
        screen.getByPlaceholderText("Search skills by name or description..."),
        "nonexistent",
      );

      expect(screen.getByText("No matching skills")).toBeInTheDocument();
      expect(
        screen.getByText("Try a different search term."),
      ).toBeInTheDocument();
    });
  });

  describe("Skill card menu", () => {
    it("shows dropdown menu with Edit, Duplicate, Export, Delete options", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.click(screen.getByLabelText("Options for code-review"));

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /edit/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /duplicate/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /export/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /delete/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Delete confirmation", () => {
    it("shows confirmation dialog when delete is clicked", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.click(screen.getByLabelText("Options for code-review"));
      await user.click(screen.getByRole("menuitem", { name: /delete/i }));

      expect(screen.getByText("Delete skill?")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete "code-review"\?/),
      ).toBeInTheDocument();
    });

    it("cancels deletion when Cancel is clicked", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.click(screen.getByLabelText("Options for code-review"));
      await user.click(screen.getByRole("menuitem", { name: /delete/i }));
      expect(screen.getByText("Delete skill?")).toBeInTheDocument();

      await user.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Delete skill?")).not.toBeInTheDocument();
    });

    it("removes skill when delete is confirmed", async () => {
      for (const s of mockSkills) {
        await skillsAdapter.create(s);
      }
      const user = userEvent.setup();
      render(<SkillsView />);
      await screen.findByText("code-review");

      await user.click(screen.getByLabelText("Options for code-review"));
      await user.click(screen.getByRole("menuitem", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(screen.queryByText("code-review")).not.toBeInTheDocument();
      });
    });
  });
});
