export type ConnectionStatus = "connecting" | "connected" | "failed";
export type ConnectionEvent = "connect" | "close" | "error" | "reconnect";

export const INITIAL_STATUS: ConnectionStatus = "connecting";

export function transition(
  status: ConnectionStatus,
  event: ConnectionEvent,
): ConnectionStatus {
  if (event === "connect") return "connected";
  if (event === "close" || event === "error") return "failed";
  if (event === "reconnect") return "connecting";
  return status;
}
