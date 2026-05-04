import { useEffect } from "react";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";
import {
  getClient,
  setNotificationHandler,
} from "@/shared/api/acpConnection";
import notificationHandler from "@/shared/api/acpNotificationHandler";
import { getProviderInventory } from "@/features/providers/api/inventory";

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
      void loadProviderInventory();
    })();
  }, []);
}

async function loadProviderInventory(): Promise<void> {
  try {
    useProviderInventoryStore.getState().setLoading(true);
    const entries = await getProviderInventory();
    useProviderInventoryStore.getState().setEntries(entries);
  } catch (err) {
    console.error("Failed to load provider inventory:", err);
  } finally {
    useProviderInventoryStore.getState().setLoading(false);
  }
}
