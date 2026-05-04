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
