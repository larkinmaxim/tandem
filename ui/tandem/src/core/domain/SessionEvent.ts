export type SessionEventKind =
  | "agent-message-chunk"
  | "user-message-chunk"
  | "tool-call-started"
  | "tool-call-update"
  | "session-info-update"
  | "config-option-update"
  | "usage-update"
  | "turn-ended";

interface BaseSessionEvent {
  readonly sessionId: string;
}

export interface AgentMessageChunkEvent extends BaseSessionEvent {
  readonly kind: "agent-message-chunk";
  readonly messageId: string;
  readonly contentType: string;
  readonly text?: string;
}

export interface UserMessageChunkEvent extends BaseSessionEvent {
  readonly kind: "user-message-chunk";
  readonly messageId: string;
  readonly contentType: string;
  readonly text?: string;
}

export interface ToolCallStartedEvent extends BaseSessionEvent {
  readonly kind: "tool-call-started";
  readonly toolCallId: string;
  readonly title: string;
}

export interface ToolCallUpdateEvent extends BaseSessionEvent {
  readonly kind: "tool-call-update";
  readonly toolCallId: string;
  readonly title?: string;
  readonly status?: string;
  readonly content?: Array<unknown> | null;
  readonly rawOutput?: unknown;
}

export interface SessionInfoUpdateEvent extends BaseSessionEvent {
  readonly kind: "session-info-update";
  readonly title?: string;
}

export interface ConfigOptionUpdateEvent extends BaseSessionEvent {
  readonly kind: "config-option-update";
  readonly options: ReadonlyArray<{
    category?: string;
    kind?: Record<string, unknown>;
  }>;
}

export interface UsageUpdateEvent extends BaseSessionEvent {
  readonly kind: "usage-update";
  readonly used: number;
  readonly size: number;
}

export interface TurnEndedEvent extends BaseSessionEvent {
  readonly kind: "turn-ended";
}

export type SessionEvent =
  | AgentMessageChunkEvent
  | UserMessageChunkEvent
  | ToolCallStartedEvent
  | ToolCallUpdateEvent
  | SessionInfoUpdateEvent
  | ConfigOptionUpdateEvent
  | UsageUpdateEvent
  | TurnEndedEvent;
