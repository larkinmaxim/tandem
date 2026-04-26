import { MessageSquare, Plus, X } from "lucide-react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";

export interface TabDescriptor {
  id: string;
  title: string;
}

interface TabBarProps {
  tabs: TabDescriptor[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

const tabBarStyle: CSSProperties = {
  height: "var(--tabbar-height)",
  flex: "0 0 var(--tabbar-height)",
  display: "flex",
  alignItems: "stretch",
  background: "var(--color-bg)",
  borderBottom: "1px solid var(--color-border-subtle)",
  paddingLeft: "var(--space-1)",
  paddingRight: "var(--space-1)",
};

const tabStripStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  alignItems: "stretch",
  overflowX: "auto",
  overflowY: "hidden",
  minWidth: 0,
  scrollbarWidth: "none",
};

const tabStyle = (active: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 10px",
  height: "calc(var(--tabbar-height) - 4px)",
  margin: "2px 2px 0",
  borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
  background: active ? "var(--color-canvas)" : "transparent",
  color: active ? "var(--color-text)" : "var(--color-text-muted)",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
  position: "relative",
  flex: "0 1 200px",
  minWidth: 0,
  border: 0,
  maxWidth: 220,
  transition: "background var(--dur-fast) var(--ease-out)",
});

const tabTitleStyle: CSSProperties = {
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "var(--text-sm)",
  textAlign: "left",
};

const tabIconStyle = (active: boolean): CSSProperties => ({
  flex: "0 0 auto",
  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
  display: "flex",
});

const tabCloseStyle: CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: "var(--radius-xs)",
  background: "transparent",
  border: 0,
  color: "var(--color-text-muted)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

const newButtonStyle: CSSProperties = {
  alignSelf: "center",
  marginLeft: 4,
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: 0,
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-muted)",
  cursor: "pointer",
  flex: "0 0 auto",
};

export const TabBar = ({
  tabs,
  activeId,
  onActivate,
  onClose,
  onNew,
}: TabBarProps) => {
  const handleClose = (id: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClose(id);
  };

  const handleTabKeyDown =
    (id: string) => (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate(id);
      }
    };

  return (
    <div data-testid="tab-bar" style={tabBarStyle}>
      <div style={tabStripStyle}>
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <div
              key={tab.id}
              role="tab"
              tabIndex={0}
              aria-selected={active}
              data-testid={`tab-${tab.id}`}
              data-active={String(active)}
              onClick={() => onActivate(tab.id)}
              onKeyDown={handleTabKeyDown(tab.id)}
              style={tabStyle(active)}
              title={tab.title}
            >
              <span style={tabIconStyle(active)}>
                <MessageSquare size={12} aria-hidden="true" />
              </span>
              <span style={tabTitleStyle}>{tab.title}</span>
              <button
                type="button"
                data-testid={`tab-close-${tab.id}`}
                aria-label={`Close ${tab.title}`}
                onClick={handleClose(tab.id)}
                style={tabCloseStyle}
              >
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          data-testid="tab-new"
          aria-label="New tab"
          title="New tab"
          onClick={onNew}
          style={newButtonStyle}
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
