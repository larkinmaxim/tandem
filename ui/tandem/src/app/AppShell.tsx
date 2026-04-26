import { useState, type CSSProperties } from "react";

import { useConnectionStatus } from "@/features/connection/hooks/useConnectionStatus";
import { StatusBar } from "@/features/status/ui/StatusBar";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";

const RIBBON_WIDTH = 44;
const LEFT_PANE_WIDTH = 280;
const RIGHT_PANE_EXPANDED = 320;
const RIGHT_PANE_COLLAPSED = 44;

type SectionId = "chat" | "projects" | "memory" | "workflows" | "skills";

const zoneBase: CSSProperties = {
  height: "100%",
  overflow: "hidden",
};

export const AppShell = () => {
  const [section] = useState<SectionId>("chat");
  const [rightCollapsed] = useState(true);

  const connectionStatus = useConnectionStatus();
  const sessions = useChatSessionStore((s) => s.sessions);
  const activeSessionId = useChatSessionStore((s) => s.activeSessionId);
  const activeSession = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId)
    : undefined;

  const rightWidth = rightCollapsed ? RIGHT_PANE_COLLAPSED : RIGHT_PANE_EXPANDED;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${RIBBON_WIDTH}px ${LEFT_PANE_WIDTH}px 1fr ${rightWidth}px`,
        gridTemplateRows: "1fr var(--statusbar-height)",
        gridTemplateAreas: `
          "ribbon left main right"
          "status status status status"
        `,
        height: "100vh",
        width: "100vw",
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        data-testid="zone-ribbon"
        style={{
          ...zoneBase,
          gridArea: "ribbon",
          width: `${RIBBON_WIDTH}px`,
          background: "var(--color-bg)",
          borderRight: "1px solid var(--color-border-subtle)",
        }}
      />
      <div
        data-testid="zone-left-pane"
        style={{
          ...zoneBase,
          gridArea: "left",
          width: `${LEFT_PANE_WIDTH}px`,
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border-subtle)",
        }}
      />
      <div
        data-testid="zone-main"
        data-section={section}
        style={{
          ...zoneBase,
          gridArea: "main",
          background: "var(--color-canvas)",
        }}
      />
      <div
        data-testid="zone-right-pane"
        data-collapsed={String(rightCollapsed)}
        style={{
          ...zoneBase,
          gridArea: "right",
          width: `${rightWidth}px`,
          background: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border-subtle)",
        }}
      />
      <div style={{ gridArea: "status" }}>
        <StatusBar
          connectionStatus={connectionStatus}
          modelName={activeSession?.modelName}
          contextFolder="Default"
          mcpCount={0}
          sessionCount={sessions.length}
          skillsCount={0}
        />
      </div>
    </div>
  );
};
