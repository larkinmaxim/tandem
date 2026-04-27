import { useEffect } from "react";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import {
  getClient,
  setNotificationHandler,
} from "@/shared/api/acpConnection";
import notificationHandler from "@/shared/api/acpNotificationHandler";

// Phase 3a startup: register the chat notification handler so ACP
// session_update events flow into chatStore, then prime the ACP client and
// hydrate the session list. Phase 3b+ will expand this with provider
// inventory, personas, etc. — see ui/goose2/src/app/hooks/useAppStartup.ts
// for the fully-loaded shape.
export function useAppStartup(): void {
  useEffect(() => {
    void (async () => {
      try {
        setNotificationHandler(notificationHandler);
        await getClient();
      } catch (err) {
        console.error("Failed to initialize ACP connection:", err);
      }
      void useChatSessionStore.getState().loadSessions();
    })();
  }, []);
}
