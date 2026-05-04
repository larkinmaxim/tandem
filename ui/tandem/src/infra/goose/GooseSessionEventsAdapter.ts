import type { SessionNotification, SessionUpdate } from "@agentclientprotocol/sdk";
import type {
  SessionEventsPort,
  SessionEventListener,
} from "@/core/ports/SessionEventsPort";
import type { SessionEvent, SessionEventKind } from "@/core/domain/SessionEvent";
import type { Subscription } from "@/core/domain/Subscription";
import type { NotificationSink, GooseConnection } from "./GooseConnection";

type RawNotificationHandler = (notification: SessionNotification) => Promise<void>;

type SubscriptionEntry =
  | { type: "session"; sessionId: string; listener: SessionEventListener }
  | { type: "all"; listener: SessionEventListener }
  | { type: "kind"; kind: SessionEventKind; listener: SessionEventListener };

export class GooseSessionEventsAdapter implements SessionEventsPort, NotificationSink {
  private subscriptions = new Set<SubscriptionEntry>();
  private rawHandler: RawNotificationHandler | null;

  constructor(connection: GooseConnection, rawHandler?: RawNotificationHandler) {
    this.rawHandler = rawHandler ?? null;
    connection.setNotificationSink(this);
  }

  async handleSessionNotification(notification: SessionNotification): Promise<void> {
    if (this.rawHandler) {
      await this.rawHandler(notification);
    }

    const event = translateNotification(notification);
    if (!event) return;

    for (const entry of this.subscriptions) {
      switch (entry.type) {
        case "session":
          if (entry.sessionId === event.sessionId) entry.listener(event);
          break;
        case "all":
          entry.listener(event);
          break;
        case "kind":
          if (entry.kind === event.kind) entry.listener(event);
          break;
      }
    }
  }

  subscribe(sessionId: string, listener: SessionEventListener): Subscription {
    const entry: SubscriptionEntry = { type: "session", sessionId, listener };
    this.subscriptions.add(entry);
    return { unsubscribe: () => this.subscriptions.delete(entry) };
  }

  subscribeAll(listener: SessionEventListener): Subscription {
    const entry: SubscriptionEntry = { type: "all", listener };
    this.subscriptions.add(entry);
    return { unsubscribe: () => this.subscriptions.delete(entry) };
  }

  on(kind: SessionEventKind, handler: SessionEventListener): Subscription {
    const entry: SubscriptionEntry = { type: "kind", kind, listener: handler };
    this.subscriptions.add(entry);
    return { unsubscribe: () => this.subscriptions.delete(entry) };
  }
}

function translateNotification(notification: SessionNotification): SessionEvent | null {
  const { sessionId, update } = notification;
  return translateUpdate(sessionId, update);
}

function translateUpdate(sessionId: string, update: SessionUpdate): SessionEvent | null {
  switch (update.sessionUpdate) {
    case "agent_message_chunk":
      return {
        kind: "agent-message-chunk",
        sessionId,
        messageId: update.messageId ?? "",
        contentType: update.content?.type ?? "unknown",
        text: update.content?.type === "text" && "text" in update.content
          ? (update.content as { type: "text"; text: string }).text
          : undefined,
      };

    case "user_message_chunk":
      return {
        kind: "user-message-chunk",
        sessionId,
        messageId: (update as SessionUpdate & { messageId?: string }).messageId ?? "",
        contentType: (update as SessionUpdate & { content?: { type: string } }).content?.type ?? "unknown",
        text:
          (update as SessionUpdate & { content?: { type: string; text?: string } }).content?.type === "text"
            ? (update as SessionUpdate & { content: { text: string } }).content.text
            : undefined,
      };

    case "tool_call":
      return {
        kind: "tool-call-started",
        sessionId,
        toolCallId: update.toolCallId,
        title: update.title,
      };

    case "tool_call_update":
      return {
        kind: "tool-call-update",
        sessionId,
        toolCallId: update.toolCallId,
        title: update.title ?? undefined,
        status: update.status ?? undefined,
        content: update.content ?? undefined,
        rawOutput: (update as SessionUpdate & { rawOutput?: unknown }).rawOutput,
      };

    case "session_info_update":
      return {
        kind: "session-info-update",
        sessionId,
        title: (update as SessionUpdate & { title?: string }).title,
      };

    case "config_option_update":
      return {
        kind: "config-option-update",
        sessionId,
        options: (update as SessionUpdate & { options?: Array<{ category?: string; kind?: Record<string, unknown> }> }).options ?? [],
      };

    case "usage_update": {
      const u = update as SessionUpdate & { used: number; size: number };
      return {
        kind: "usage-update",
        sessionId,
        used: u.used,
        size: u.size,
      };
    }

    default:
      return null;
  }
}
