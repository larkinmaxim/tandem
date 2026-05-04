import type { SessionEventKind, SessionEvent } from "@/core/domain/SessionEvent";
import type { Subscription } from "@/core/domain/Subscription";
import { sdk } from "./index";

export const notifications = {
  on(kind: SessionEventKind, handler: (event: SessionEvent) => void): Subscription {
    return sdk.events.on(kind, handler);
  },
};
