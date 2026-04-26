import {
  Brain,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

export type SectionId =
  | "chat"
  | "projects"
  | "memory"
  | "workflows"
  | "skills";

interface SectionDef {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

export const SECTIONS: SectionDef[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "skills", label: "Skills", icon: Sparkles },
];

interface SectionSwitcherProps {
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
}

const containerStyle: CSSProperties = {
  display: "flex",
  padding: "var(--space-2)",
  gap: 2,
  borderBottom: "1px solid var(--color-border-subtle)",
  flex: "0 0 auto",
};

const buttonStyle = (active: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  height: 28,
  padding: "0 8px",
  borderRadius: "var(--radius-sm)",
  background: active ? "var(--color-accent-dim)" : "transparent",
  border: 0,
  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
  cursor: "pointer",
  fontSize: "var(--text-sm)",
  fontWeight: "var(--fw-medium)" as CSSProperties["fontWeight"],
  whiteSpace: "nowrap",
  flex: "0 0 auto",
});

export const SectionSwitcher = ({
  activeSection,
  onSectionChange,
}: SectionSwitcherProps) => (
  <div data-testid="section-switcher" style={containerStyle}>
    {SECTIONS.map((section) => {
      const active = section.id === activeSection;
      const Icon = section.icon;
      return (
        <button
          key={section.id}
          type="button"
          data-testid={`section-btn-${section.id}`}
          data-section-id={section.id}
          data-active={String(active)}
          onClick={() => onSectionChange(section.id)}
          style={buttonStyle(active)}
        >
          <Icon size={14} aria-hidden="true" />
          <span>{section.label}</span>
        </button>
      );
    })}
  </div>
);
