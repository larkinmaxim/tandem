import type { CSSProperties } from "react";

import type { SectionId } from "@/features/sections/ui/SectionSwitcher";

type StubSection = Exclude<SectionId, "chat">;

interface StubCopy {
  title: string;
  body: string;
}

const STUB_COPY: Record<StubSection, StubCopy> = {
  projects: {
    title: "Projects",
    body: "Projects is shipping in v1.2. Until then, set your working directory via goose2's settings.",
  },
  memory: {
    title: "Memory",
    body: "Memory is shipping in v1.4.",
  },
  workflows: {
    title: "Workflows",
    body: "Workflows is shipping in v1.3.",
  },
  skills: {
    title: "Skills",
    body: "Skills is shipping in v1.2.",
  },
};

interface StubBodyProps {
  section: StubSection;
}

const containerStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--space-6)",
  textAlign: "center",
  color: "var(--color-text-secondary)",
  fontSize: "var(--text-sm)",
  lineHeight: "var(--lh-normal)",
};

const titleStyle: CSSProperties = {
  fontSize: "var(--text-lg)",
  fontWeight: "var(--fw-semibold)" as CSSProperties["fontWeight"],
  color: "var(--color-text)",
  marginBottom: "var(--space-2)",
};

export const StubBody = ({ section }: StubBodyProps) => {
  const copy = STUB_COPY[section];
  return (
    <div data-testid="stub-body" data-section={section} style={containerStyle}>
      <div style={titleStyle}>{copy.title}</div>
      <div>{copy.body}</div>
    </div>
  );
};
