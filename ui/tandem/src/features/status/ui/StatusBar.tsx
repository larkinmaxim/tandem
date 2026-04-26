import { Bot, Folder, Plug, MessageSquare, Sparkles } from "lucide-react";

import { ConnectionIndicator } from "@/features/connection/ui/ConnectionIndicator";
import type { ConnectionStatus } from "@/features/connection/lib/connectionStatusMachine";

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  modelName?: string;
  contextFolder: string;
  mcpCount: number;
  sessionCount: number;
  skillsCount: number;
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const iconSize = 12;
const iconColor = "var(--color-text-muted)";

export const StatusBar = ({
  connectionStatus,
  modelName,
  contextFolder,
  mcpCount,
  sessionCount,
  skillsCount,
}: StatusBarProps) => (
  <div
    data-testid="status-bar"
    style={{
      height: "var(--statusbar-height)",
      flex: "0 0 var(--statusbar-height)",
      background: "var(--color-surface)",
      borderTop: "1px solid var(--color-border-subtle)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      padding: "0 var(--space-3)",
      fontSize: "var(--text-xs)",
      color: "var(--color-text-muted)",
      fontFamily: "var(--font-mono)",
    }}
  >
    <span data-testid="status-item-connection" style={itemStyle}>
      <ConnectionIndicator status={connectionStatus} />
    </span>
    <span data-testid="status-item-model" style={itemStyle}>
      <Bot size={iconSize} color={iconColor} aria-hidden="true" />
      {modelName ?? "—"}
    </span>
    <span data-testid="status-item-folder" style={itemStyle}>
      <Folder size={iconSize} color={iconColor} aria-hidden="true" />
      {contextFolder}
    </span>
    <span data-testid="status-item-mcp" style={itemStyle}>
      <Plug size={iconSize} color={iconColor} aria-hidden="true" />
      {mcpCount} MCP
    </span>
    <span data-testid="status-item-sessions" style={itemStyle}>
      <MessageSquare size={iconSize} color={iconColor} aria-hidden="true" />
      {sessionCount} sessions
    </span>
    <span data-testid="status-item-skills" style={itemStyle}>
      <Sparkles size={iconSize} color={iconColor} aria-hidden="true" />
      {skillsCount} skills
    </span>
  </div>
);
