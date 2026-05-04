import { invoke } from "@tauri-apps/api/core";
import { GooseClient } from "@aaif/goose-sdk";
import {
  PROTOCOL_VERSION,
  type Client,
  type SessionNotification,
  type RequestPermissionRequest,
  type RequestPermissionResponse,
} from "@agentclientprotocol/sdk";
import { createWebSocketStream } from "@/shared/api/createWebSocketStream";
import { perfLog } from "@/shared/lib/perfLog";

export interface NotificationSink {
  handleSessionNotification(notification: SessionNotification): Promise<void>;
}

export class GooseConnection {
  private clientPromise: Promise<GooseClient> | null = null;
  private resolvedClient: GooseClient | null = null;
  private notificationSink: NotificationSink | null = null;

  setNotificationSink(sink: NotificationSink): void {
    this.notificationSink = sink;
  }

  async getClient(): Promise<GooseClient> {
    if (this.resolvedClient) return this.resolvedClient;

    if (!this.clientPromise) {
      perfLog("[perf:conn] getClient() → initializing new ACP connection");
      this.clientPromise = this.initializeConnection()
        .then((client) => {
          this.resolvedClient = client;
          return client;
        })
        .catch((error) => {
          this.clientPromise = null;
          throw error;
        });
    } else {
      perfLog("[perf:conn] getClient() awaiting in-flight initializeConnection");
    }

    return this.clientPromise;
  }

  isReady(): boolean {
    return this.resolvedClient !== null;
  }

  getClientSync(): GooseClient | null {
    return this.resolvedClient;
  }

  private createClientCallbacks(): () => Client {
    return () => ({
      requestPermission: async (
        args: RequestPermissionRequest,
      ): Promise<RequestPermissionResponse> => {
        const optionId = args.options?.[0]?.optionId ?? "approve";
        return {
          outcome: {
            outcome: "selected",
            optionId,
          },
        };
      },

      sessionUpdate: async (
        notification: SessionNotification,
      ): Promise<void> => {
        if (this.notificationSink) {
          await this.notificationSink.handleSessionNotification(notification);
        }
      },
    });
  }

  private monitorConnection(client: GooseClient): void {
    client.closed
      .then(() => {
        console.warn(
          "[acp] Connection closed. Will reconnect on next getClient().",
        );
        this.resolvedClient = null;
        this.clientPromise = null;
      })
      .catch(() => {
        console.warn(
          "[acp] Connection error. Will reconnect on next getClient().",
        );
        this.resolvedClient = null;
        this.clientPromise = null;
      });
  }

  private async initializeConnection(): Promise<GooseClient> {
    const tStart = performance.now();
    const wsUrl: string = await invoke("get_goose_serve_url");
    perfLog(
      `[perf:conn] get_goose_serve_url in ${(performance.now() - tStart).toFixed(1)}ms`,
    );

    const tStream = performance.now();
    const stream = createWebSocketStream(wsUrl);

    const client = new GooseClient(this.createClientCallbacks(), stream);
    perfLog(
      `[perf:conn] ws stream + client created in ${(performance.now() - tStream).toFixed(1)}ms`,
    );

    const tInit = performance.now();
    await client.initialize({
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: {},
      clientInfo: {
        name: "tandem",
        version: "0.1.0",
      },
    });
    perfLog(
      `[perf:conn] client.initialize in ${(performance.now() - tInit).toFixed(1)}ms (total ${(performance.now() - tStart).toFixed(1)}ms)`,
    );

    this.monitorConnection(client);

    return client;
  }
}
