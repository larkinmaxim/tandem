import type { ConnectionPort } from "@/core/ports/ConnectionPort";
import type { ConnectionState } from "@/core/domain/ConnectionState";
import type { Subscription } from "@/core/domain/Subscription";

type ConnectionListener = (state: ConnectionState) => void;

export class InMemoryConnection implements ConnectionPort {
  private currentState: ConnectionState;
  private listeners = new Set<ConnectionListener>();

  constructor(initialState: ConnectionState = "ready") {
    this.currentState = initialState;
  }

  state(): ConnectionState {
    return this.currentState;
  }

  observe(listener: ConnectionListener): Subscription {
    this.listeners.add(listener);
    return {
      unsubscribe: () => this.listeners.delete(listener),
    };
  }

  async ensure(): Promise<void> {
    this.setStateTo("ready");
  }

  setStateTo(next: ConnectionState): void {
    if (next === this.currentState) return;
    this.currentState = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
