import type {
  SessionEventsPort,
  SessionEventListener,
} from "@/core/ports/SessionEventsPort";
import type { SessionEvent, SessionEventKind } from "@/core/domain/SessionEvent";
import type { Subscription } from "@/core/domain/Subscription";

type SubscriptionEntry =
  | { type: "session"; sessionId: string; listener: SessionEventListener }
  | { type: "all"; listener: SessionEventListener }
  | { type: "kind"; kind: SessionEventKind; listener: SessionEventListener };

export class InMemorySessionEvents implements SessionEventsPort {
  private subscriptions = new Set<SubscriptionEntry>();

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

  emit(event: SessionEvent): void {
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
}
