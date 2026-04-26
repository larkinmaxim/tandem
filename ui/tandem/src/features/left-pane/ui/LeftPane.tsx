import { PanelLeft, Plus, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import {
  SectionSwitcher,
  type SectionId,
} from "@/features/sections/ui/SectionSwitcher";

interface LeftPaneProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
  onNewChat: () => void;
}

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 52;

const paneStyle = (collapsed: boolean): CSSProperties => ({
  width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
  flex: `0 0 ${collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}px`,
  height: "100%",
  background: "var(--color-surface)",
  borderRight: "1px solid var(--color-border-subtle)",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
});

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
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
  flex: "0 0 auto",
};

const searchWrapStyle: CSSProperties = {
  position: "relative",
  flex: 1,
  display: "flex",
  alignItems: "center",
  minWidth: 0,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: 28,
  padding: "0 8px 0 28px",
  background: "var(--color-surface-sunken)",
  border: "1px solid transparent",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text)",
  fontSize: "var(--text-sm)",
  outline: "none",
};

const searchIconWrapStyle: CSSProperties = {
  position: "absolute",
  left: 8,
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--color-text-muted)",
  pointerEvents: "none",
  display: "flex",
};

const bodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
};

const sessionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "6px 12px",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-secondary)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const emptyHintStyle: CSSProperties = {
  padding: "var(--space-4)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-muted)",
  textAlign: "center",
};

export const LeftPane = ({
  collapsed,
  onToggleCollapsed,
  activeSection,
  onSectionChange,
  onNewChat,
}: LeftPaneProps) => {
  const [search, setSearch] = useState("");
  const sessions = useChatSessionStore((s) => s.sessions);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  return (
    <div
      data-testid="zone-left-pane"
      data-collapsed={String(collapsed)}
      style={paneStyle(collapsed)}
    >
      <div style={headerStyle}>
        <button
          type="button"
          data-testid="left-pane-toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
          style={iconButtonStyle}
        >
          <PanelLeft size={15} aria-hidden="true" />
        </button>
        {!collapsed && (
          <>
            <div style={searchWrapStyle}>
              <span style={searchIconWrapStyle}>
                <Search size={13} aria-hidden="true" />
              </span>
              <input
                type="text"
                data-testid="left-pane-search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>
            <button
              type="button"
              data-testid="left-pane-new-chat"
              aria-label="New chat"
              onClick={onNewChat}
              style={iconButtonStyle}
            >
              <Plus size={15} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {!collapsed && (
        <>
          <SectionSwitcher
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
          <div style={bodyStyle}>
            {activeSection === "chat" ? (
              filteredSessions.length === 0 ? (
                <div style={emptyHintStyle}>
                  {sessions.length === 0
                    ? "No chats yet."
                    : "No matching chats."}
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    data-testid={`session-row-${session.id}`}
                    style={sessionRowStyle}
                  >
                    {session.title}
                  </div>
                ))
              )
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
