import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { useAppStartup } from "@/app/hooks/useAppStartup";
import { useConnectionStatus } from "@/features/connection/hooks/useConnectionStatus";
import { LeftPane } from "@/features/left-pane/ui/LeftPane";
import { Ribbon, type AppId } from "@/features/ribbon/ui/Ribbon";
import { RightPane } from "@/features/right-pane/ui/RightPane";
import type { SectionId } from "@/features/sections/ui/SectionSwitcher";
import { StubBody } from "@/features/sections/ui/StubBody";
import { StatusBar } from "@/features/status/ui/StatusBar";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { ChatPane } from "@/features/chat/ui/ChatPane";
import { TabBar, type TabDescriptor } from "@/features/tabs/ui/TabBar";
import {
  DRAFT_TAB_PREFIX,
  useTabsStore,
} from "@/features/tabs/stores/tabsStore";
import { ToastViewport } from "@/features/toasts/ToastViewport";

const RIBBON_WIDTH = 44;
const LEFT_PANE_EXPANDED = 280;
const LEFT_PANE_COLLAPSED = 52;
const RIGHT_PANE_EXPANDED = 320;
const RIGHT_PANE_COLLAPSED = 44;

const mainPaneStyle: CSSProperties = {
  height: "100%",
  background: "var(--color-canvas)",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

export const AppShell = () => {
  const [activeApp, setActiveApp] = useState<AppId>("chat");
  const [section, setSection] = useState<SectionId>("chat");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(true);

  useAppStartup();

  const connectionStatus = useConnectionStatus();
  const sessions = useChatSessionStore((s) => s.sessions);
  const activeSessionId = useChatSessionStore((s) => s.activeSessionId);
  const activeSession = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId)
    : undefined;

  const tabOpenIds = useTabsStore((s) => s.openIds);
  const tabActiveId = useTabsStore((s) => s.activeId);
  const openTab = useTabsStore((s) => s.openTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const switchTab = useTabsStore((s) => s.switchTab);
  const newTab = useTabsStore((s) => s.newTab);
  const hydrateTabs = useTabsStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTabs();
  }, [hydrateTabs]);

  const tabs = useMemo<TabDescriptor[]>(
    () =>
      tabOpenIds.map((id) => {
        if (id.startsWith(DRAFT_TAB_PREFIX)) {
          return { id, title: "New Chat" };
        }
        const session = sessions.find((s) => s.id === id);
        return { id, title: session?.title ?? "Untitled" };
      }),
    [tabOpenIds, sessions],
  );

  const handleNewTab = () => {
    newTab();
  };

  const leftWidth = leftCollapsed ? LEFT_PANE_COLLAPSED : LEFT_PANE_EXPANDED;
  const rightWidth = rightCollapsed ? RIGHT_PANE_COLLAPSED : RIGHT_PANE_EXPANDED;

  const isStubSection = section !== "chat";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${RIBBON_WIDTH}px ${leftWidth}px 1fr ${rightWidth}px`,
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
      <div style={{ gridArea: "ribbon", overflow: "hidden" }}>
        <Ribbon activeApp={activeApp} onActivate={setActiveApp} />
      </div>
      <div style={{ gridArea: "left", overflow: "hidden" }}>
        <LeftPane
          collapsed={leftCollapsed}
          onToggleCollapsed={() => setLeftCollapsed((c) => !c)}
          activeSection={section}
          onSectionChange={setSection}
          onNewChat={handleNewTab}
          onSessionClick={openTab}
        />
      </div>
      <div
        data-testid="zone-main"
        data-section={section}
        style={mainPaneStyle}
      >
        {isStubSection ? (
          <StubBody section={section} />
        ) : (
          <>
            <TabBar
              tabs={tabs}
              activeId={tabActiveId}
              onActivate={switchTab}
              onClose={closeTab}
              onNew={handleNewTab}
            />
            <ChatPane />
          </>
        )}
      </div>
      <div style={{ gridArea: "right", overflow: "hidden" }}>
        <RightPane
          collapsed={rightCollapsed}
          onToggleCollapsed={() => setRightCollapsed((c) => !c)}
        />
      </div>
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
      <ToastViewport />
    </div>
  );
};
