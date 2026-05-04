import { HomeScreen } from "@/features/home/ui/HomeScreen";
import { ChatView } from "@/features/chat/ui/ChatView";
import { SkillsView } from "@/features/skills/ui/SkillsView";
import { AgentsView } from "@/features/agents/ui/AgentsView";
import { ProjectsView } from "@/features/projects/ui/ProjectsView";
import { SessionHistoryView } from "@/features/sessions/ui/SessionHistoryView";
import type { ChatSession } from "@/features/chat/stores/chatSessionStore";
import type { ChatAttachmentDraft } from "@/shared/types/messages";
import type { ProjectInfo } from "@/features/projects/api/projects";
import type { AppView } from "../AppShell";
import { useArtifactStore } from "@/features/artifacts/stores/artifactStore";
import { ArtifactViewer } from "@/features/artifacts/ui/ArtifactViewer";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useEffect } from "react";

interface AppShellContentProps {
  activeView: AppView;
  activeSession?: ChatSession;
  activeSessionPersonaId?: string;
  homeSelectedProvider?: string;
  homeSelectedPersonaId?: string;
  pendingInitialMessage?: string;
  pendingInitialAttachments?: ChatAttachmentDraft[];
  onArchiveChat: (sessionId: string) => Promise<void>;
  onCreateProject: (options?: {
    initialWorkingDir?: string | null;
    onCreated?: (projectId: string) => void;
  }) => void;
  onHomeStartChat: (
    initialMessage?: string,
    providerId?: string,
    personaId?: string,
    projectId?: string | null,
    attachments?: ChatAttachmentDraft[],
  ) => void;
  onInitialMessageConsumed: () => void;
  onRenameChat: (sessionId: string, nextTitle: string) => void;
  onSelectSession: (sessionId: string) => void;
  onSelectSearchResult: (
    sessionId: string,
    messageId?: string,
    query?: string,
  ) => void;
  onStartChatFromProject: (project: ProjectInfo) => void;
}

export function AppShellContent({
  activeView,
  activeSession,
  activeSessionPersonaId,
  homeSelectedProvider,
  homeSelectedPersonaId,
  pendingInitialMessage,
  pendingInitialAttachments,
  onArchiveChat,
  onCreateProject,
  onHomeStartChat,
  onInitialMessageConsumed,
  onRenameChat,
  onSelectSession,
  onSelectSearchResult,
  onStartChatFromProject,
}: AppShellContentProps) {
  const { isOpen, content, filePath, closeArtifact } = useArtifactStore();
  const [panelWidth, setPanelWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeDoubleClick = useCallback(() => {
    setPanelWidth(600);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate width from the right edge
      const newWidth = Math.max(300, Math.min(1000, document.body.clientWidth - e.clientX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const renderContent = () => {
    switch (activeView) {
      case "skills":
        return <SkillsView />;
      case "agents":
        return <AgentsView />;
      case "projects":
        return <ProjectsView onStartChat={onStartChatFromProject} />;
      case "session-history":
        return (
          <SessionHistoryView
            onSelectSession={onSelectSession}
            onSelectSearchResult={onSelectSearchResult}
            onRenameChat={onRenameChat}
            onArchiveChat={onArchiveChat}
          />
        );
      case "chat":
      case "home":
        return activeSession ? (
          <ChatView
            key={activeSession.id}
            sessionId={activeSession.id}
            initialProvider={homeSelectedProvider}
            initialPersonaId={activeSessionPersonaId ?? homeSelectedPersonaId}
            initialMessage={pendingInitialMessage}
            initialAttachments={pendingInitialAttachments}
            onCreateProject={onCreateProject}
            onInitialMessageConsumed={onInitialMessageConsumed}
          />
        ) : (
          <HomeScreen
            onStartChat={onHomeStartChat}
            onCreateProject={onCreateProject}
          />
        );
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 min-w-0 h-full">{renderContent()}</div>
      <AnimatePresence>
        {isOpen && content && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelWidth + 24, opacity: 1 }} // width + padding (12px * 2)
            exit={{ width: 0, opacity: 0 }}
            transition={
              isResizing
                ? { duration: 0 }
                : { type: "spring", damping: 25, stiffness: 200 }
            }
            className="flex h-full shrink-0 relative"
          >
            {/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle for right panel resize */}
            <div
              onMouseDown={handleResizeStart}
              onDoubleClick={handleResizeDoubleClick}
              className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize group flex items-center justify-center z-10"
            >
              <div className="w-px h-8 rounded-full bg-transparent group-hover:bg-border transition-colors" />
            </div>
            <div className="flex flex-1 p-3 pl-1.5 h-full overflow-hidden">
              <aside className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                <ArtifactViewer
                  content={content}
                  title={filePath ? filePath.split(/[\\/]+/).pop() : null}
                  onClose={closeArtifact}
                />
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
