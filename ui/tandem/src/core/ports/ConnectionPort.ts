import type { ConnectionState } from "../domain/ConnectionState";
import type { Subscription } from "../domain/Subscription";

export interface ConnectionPort {
  state(): ConnectionState;
  observe(listener: (state: ConnectionState) => void): Subscription;
  ensure(): Promise<void>;
}
