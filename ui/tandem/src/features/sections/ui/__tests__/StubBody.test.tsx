import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { StubBody } from "@/features/sections/ui/StubBody";

describe("StubBody", () => {
  it("renders Projects copy with v1.2 target and goose2 workaround", () => {
    render(<StubBody section="projects" />);
    expect(screen.getByTestId("stub-body")).toHaveTextContent(
      "Projects is shipping in v1.2. Until then, set your working directory via goose2's settings.",
    );
  });

  it("renders Memory copy with v1.4 target", () => {
    render(<StubBody section="memory" />);
    expect(screen.getByTestId("stub-body")).toHaveTextContent(
      "Memory is shipping in v1.4.",
    );
  });

  it("renders Workflows copy with v1.3 target", () => {
    render(<StubBody section="workflows" />);
    expect(screen.getByTestId("stub-body")).toHaveTextContent(
      "Workflows is shipping in v1.3.",
    );
  });

  it("renders Skills copy with v1.2 target", () => {
    render(<StubBody section="skills" />);
    expect(screen.getByTestId("stub-body")).toHaveTextContent(
      "Skills is shipping in v1.2.",
    );
  });

  it("tags the rendered body with the section id", () => {
    render(<StubBody section="memory" />);
    expect(screen.getByTestId("stub-body")).toHaveAttribute(
      "data-section",
      "memory",
    );
  });
});
