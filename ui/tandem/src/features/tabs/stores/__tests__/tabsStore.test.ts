import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import {
  DRAFT_TAB_PREFIX,
  useTabsStore,
} from "@/features/tabs/stores/tabsStore";
import { TABS_STORAGE_KEY } from "@/features/tabs/lib/tabPersistence";

vi.mock("@/shared/api/acp", () => ({
  acpCreateSession: vi.fn().mockResolvedValue({ sessionId: "new-session-id" }),
  acpListSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/shared/api/acpApi", () => ({
  archiveSession: vi.fn().mockResolvedValue(undefined),
  unarchiveSession: vi.fn().mockResolvedValue(undefined),
  renameSession: vi.fn().mockResolvedValue(undefined),
  updateSessionProject: vi.fn().mockResolvedValue(undefined),
}));

function resetAll() {
  localStorage.clear();
  useChatSessionStore.setState({
    sessions: [],
    activeSessionId: null,
    isLoading: false,
    hasHydratedSessions: false,
    contextPanelOpenBySession: {},
    activeWorkspaceBySession: {},
  });
  useTabsStore.setState({ openIds: [], activeId: null });
}

function seedSession(id: string) {
  useChatSessionStore.getState().addSession({
    id,
    acpSessionId: id,
    title: `Title ${id}`,
    createdAt: "",
    updatedAt: "",
    messageCount: 0,
  });
}

describe("tabsStore", () => {
  beforeEach(() => {
    resetAll();
  });

  describe("openTab", () => {
    it("adds the tab and makes it active", () => {
      seedSession("s1");
      useTabsStore.getState().openTab("s1");

      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual(["s1"]);
      expect(activeId).toBe("s1");
    });

    it("focuses an already-open tab without duplicating", () => {
      seedSession("s1");
      seedSession("s2");
      useTabsStore.getState().openTab("s1");
      useTabsStore.getState().openTab("s2");
      useTabsStore.getState().openTab("s1");

      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual(["s1", "s2"]);
      expect(activeId).toBe("s1");
    });

    it("persists state to localStorage on each mutation", () => {
      seedSession("s1");
      useTabsStore.getState().openTab("s1");

      const raw = localStorage.getItem(TABS_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual({ openIds: ["s1"], activeId: "s1" });
    });
  });

  describe("closeTab", () => {
    it("removes the tab and persists the new state", () => {
      seedSession("s1");
      seedSession("s2");
      useTabsStore.getState().openTab("s1");
      useTabsStore.getState().openTab("s2");
      useTabsStore.getState().closeTab("s2");

      expect(useTabsStore.getState().openIds).toEqual(["s1"]);
      expect(useTabsStore.getState().activeId).toBe("s1");
      expect(JSON.parse(localStorage.getItem(TABS_STORAGE_KEY)!)).toEqual({
        openIds: ["s1"],
        activeId: "s1",
      });
    });
  });

  describe("switchTab", () => {
    it("changes activeId when sessionId is open", () => {
      seedSession("s1");
      seedSession("s2");
      useTabsStore.getState().openTab("s1");
      useTabsStore.getState().openTab("s2");
      useTabsStore.getState().switchTab("s1");

      expect(useTabsStore.getState().activeId).toBe("s1");
    });
  });

  describe("newTab", () => {
    it("opens a draft tab synchronously without touching ACP or chatSessionStore", () => {
      const draftId = useTabsStore.getState().newTab();

      expect(draftId.startsWith(DRAFT_TAB_PREFIX)).toBe(true);
      // No ACP sessions created (chatSessionStore stays empty)
      expect(useChatSessionStore.getState().sessions).toHaveLength(0);
      // tabs store opened the draft and made it active
      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual([draftId]);
      expect(activeId).toBe(draftId);
    });

    it("each newTab call produces a distinct draft id", () => {
      const a = useTabsStore.getState().newTab();
      const b = useTabsStore.getState().newTab();
      expect(a).not.toBe(b);
      expect(useTabsStore.getState().openIds).toEqual([a, b]);
    });
  });

  describe("hydrate", () => {
    it("restores persisted tabs whose sessions still exist", () => {
      seedSession("s1");
      seedSession("s2");
      localStorage.setItem(
        TABS_STORAGE_KEY,
        JSON.stringify({ openIds: ["s1", "s2"], activeId: "s2" }),
      );

      useTabsStore.getState().hydrate();

      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual(["s1", "s2"]);
      expect(activeId).toBe("s2");
    });

    it("silently drops persisted tabs whose sessions no longer exist", () => {
      seedSession("s1");
      // s2 was persisted but no longer in chatSessionStore
      localStorage.setItem(
        TABS_STORAGE_KEY,
        JSON.stringify({ openIds: ["s1", "s2"], activeId: "s2" }),
      );

      useTabsStore.getState().hydrate();

      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual(["s1"]);
      expect(activeId).toBeNull();
    });

    it("preserves persisted draft tabs (they have no backing chatSession)", () => {
      const draftId = `${DRAFT_TAB_PREFIX}abc-123`;
      localStorage.setItem(
        TABS_STORAGE_KEY,
        JSON.stringify({ openIds: [draftId], activeId: draftId }),
      );

      useTabsStore.getState().hydrate();

      const { openIds, activeId } = useTabsStore.getState();
      expect(openIds).toEqual([draftId]);
      expect(activeId).toBe(draftId);
    });
  });
});
