import type { ConnectionStatus } from "@/features/connection/lib/connectionStatusMachine";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
}

const COLOR: Record<ConnectionStatus, string> = {
  connected: "var(--color-success)",
  connecting: "var(--color-warning)",
  failed: "var(--color-danger)",
};

const TITLE: Record<ConnectionStatus, string> = {
  connected: "Connected to backend",
  connecting: "Connecting to backend…",
  failed: "Backend unreachable",
};

export const ConnectionIndicator = ({ status }: ConnectionIndicatorProps) => (
  <span
    data-testid="connection-dot"
    title={TITLE[status]}
    style={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: COLOR[status],
      display: "inline-block",
    }}
  />
);
