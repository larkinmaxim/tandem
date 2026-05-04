import { useEffect } from "react";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";
import {
  getClient,
  setNotificationHandler,
} from "@/shared/api/acpConnection";
import notificationHandler from "@/shared/api/acpNotificationHandler";

// Phase 3a startup: register the chat notification handler so ACP
// session_update events flow into chatStore, prime the ACP client, load the
// provider inventory (gates the no-providers banner), then hydrate the
// session list. Phase 3b+ will expand this with personas, etc. — see
// ui/goose2/src/app/hooks/useAppStartup.ts for the fully-loaded shape.
export function useAppStartup(): void {
  useEffect(() => {
    void (async () => {
      try {
        setNotificationHandler(notificationHandler);
        await getClient();
      } catch (err) {
        console.error("Failed to initialize ACP connection:", err);
      }
      void (async () => {
        const inventoryStore = useProviderInventoryStore.getState();
        inventoryStore.setLoading(true);
        try {
          const { getProviderInventory } = await import(
            "@/features/providers/api/inventory"
          );
          const entries = await getProviderInventory();
          inventoryStore.setEntries(entries);
        } catch (err) {
          console.error("Failed to load provider inventory on startup:", err);
        } finally {
          inventoryStore.setLoading(false);
        }
      })();
      void useChatSessionStore.getState().loadSessions();
    })();
  }, []);
}
