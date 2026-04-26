import { create } from "zustand";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import {
  loadTabsState,
  saveTabsState,
} from "@/features/tabs/lib/tabPersistence";
import {
  initialTabsState,
  tabsReducer,
  type TabsAction,
  type TabsState,
} from "@/features/tabs/lib/tabsReducer";

interface TabsActions {
  openTab: (sessionId: string) => void;
  closeTab: (sessionId: string) => void;
  switchTab: (sessionId: string) => void;
  newTab: () => string;
  hydrate: () => void;
}

export type TabsStore = TabsState & TabsActions;

// A draft tab id is recognized by this prefix; persistence treats it as
// always-existing on hydrate so freshly opened drafts survive a reload until
// Phase 3 promotes them into real ACP sessions on first message.
export const DRAFT_TAB_PREFIX = "draft-";

function isDraftId(id: string): boolean {
  return id.startsWith(DRAFT_TAB_PREFIX);
}

function sessionOrDraftExists(id: string): boolean {
  if (isDraftId(id)) return true;
  return useChatSessionStore
    .getState()
    .sessions.some((session) => session.id === id);
}

export const useTabsStore = create<TabsStore>((set, get) => {
  const dispatch = (action: TabsAction) => {
    const next = tabsReducer(
      { openIds: get().openIds, activeId: get().activeId },
      action,
    );
    set(next);
    saveTabsState(next);
  };

  return {
    ...initialTabsState,

    openTab: (sessionId) => dispatch({ type: "OPEN_TAB", sessionId }),

    closeTab: (sessionId) => dispatch({ type: "CLOSE_TAB", sessionId }),

    switchTab: (sessionId) => dispatch({ type: "SWITCH_TAB", sessionId }),

    newTab: () => {
      const draftId = `${DRAFT_TAB_PREFIX}${crypto.randomUUID()}`;
      dispatch({ type: "OPEN_TAB", sessionId: draftId });
      return draftId;
    },

    hydrate: () => {
      const restored = loadTabsState(sessionOrDraftExists);
      set(restored);
    },
  };
});
