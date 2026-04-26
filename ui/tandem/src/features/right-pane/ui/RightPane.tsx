import { PanelRight } from "lucide-react";
import type { CSSProperties } from "react";

interface RightPaneProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const EXPANDED_WIDTH = 320;
const COLLAPSED_WIDTH = 44;

const paneStyle = (collapsed: boolean): CSSProperties => ({
  width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
  flex: `0 0 ${collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}px`,
  height: "100%",
  background: "var(--color-surface)",
  borderLeft: "1px solid var(--color-border-subtle)",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-1)",
  padding: "var(--space-2)",
  borderBottom: "1px solid var(--color-border-subtle)",
  height: 40,
  flex: "0 0 40px",
};

const iconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: 0,
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-muted)",
  cursor: "pointer",
};

const placeholderStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--space-6)",
  textAlign: "center",
  color: "var(--color-text-muted)",
  fontSize: "var(--text-sm)",
};

export const RightPane = ({ collapsed, onToggleCollapsed }: RightPaneProps) => (
  <div
    data-testid="zone-right-pane"
    data-collapsed={String(collapsed)}
    style={paneStyle(collapsed)}
  >
    <div style={headerStyle}>
      <button
        type="button"
        data-testid="right-pane-toggle"
        aria-label={collapsed ? "Expand notes panel" : "Collapse notes panel"}
        onClick={onToggleCollapsed}
        style={iconButtonStyle}
      >
        <PanelRight size={15} aria-hidden="true" />
      </button>
    </div>
    {!collapsed && <div style={placeholderStyle}>Notes coming in v1.4</div>}
  </div>
);
