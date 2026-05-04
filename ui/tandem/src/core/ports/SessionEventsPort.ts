import type { SessionEvent, SessionEventKind } from "@/core/domain/SessionEvent";
import type { Subscription } from "@/core/domain/Subscription";

export type SessionEventListener = (event: SessionEvent) => void;

export interface SessionEventsPort {
  subscribe(sessionId: string, listener: SessionEventListener): Subscription;
  subscribeAll(listener: SessionEventListener): Subscription;
  on(kind: SessionEventKind, handler: (event: SessionEvent) => void): Subscription;
}
