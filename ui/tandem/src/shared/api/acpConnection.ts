import { GooseClient } from "@aaif/goose-sdk";
import type { SessionNotification } from "@agentclientprotocol/sdk";
import { GooseConnection } from "@/infra/goose/GooseConnection";

const connection = new GooseConnection();

export interface AcpNotificationHandler {
  handleSessionNotification(notification: SessionNotification): Promise<void>;
}

export function setNotificationHandler(handler: AcpNotificationHandler): void {
  connection.setNotificationSink(handler);
}

export async function getClient(): Promise<GooseClient> {
  return connection.getClient();
}

export function isClientReady(): boolean {
  return connection.isReady();
}

export function getClientSync(): GooseClient | null {
  return connection.getClientSync();
}
