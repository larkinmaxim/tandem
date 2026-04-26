import { useEffect } from "react";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";

// Phase 2 startup: hydrate the session list so the LeftPane history populates
// from goose serve. Phase 3 will expand this to load provider inventory,
// personas, etc. — see ui/goose2/src/app/hooks/useAppStartup.ts for the shape.
export function useAppStartup(): void {
  useEffect(() => {
    void useChatSessionStore.getState().loadSessions();
  }, []);
}
