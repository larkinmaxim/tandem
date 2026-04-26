import { describe, expect, it } from "vitest";
import { initialTabsState, tabsReducer, type TabsState } from "../tabsReducer";

describe("tabsReducer", () => {
  describe("OPEN_TAB", () => {
    it("adds the tab and makes it active when state is empty", () => {
      const next = tabsReducer(initialTabsState, {
        type: "OPEN_TAB",
        sessionId: "s1",
      });

      expect(next.openIds).toEqual(["s1"]);
      expect(next.activeId).toBe("s1");
    });

    it("focuses an already-open tab without duplicating it", () => {
      const state: TabsState = { openIds: ["s1", "s2", "s3"], activeId: "s1" };
      const next = tabsReducer(state, { type: "OPEN_TAB", sessionId: "s2" });

      expect(next.openIds).toEqual(["s1", "s2", "s3"]);
      expect(next.activeId).toBe("s2");
    });
  });

  describe("CLOSE_TAB", () => {
    it("removes a non-active tab and leaves activeId unchanged", () => {
      const state: TabsState = { openIds: ["s1", "s2", "s3"], activeId: "s2" };
      const next = tabsReducer(state, { type: "CLOSE_TAB", sessionId: "s3" });

      expect(next.openIds).toEqual(["s1", "s2"]);
      expect(next.activeId).toBe("s2");
    });

    it("returns the same state when closing a non-existent tab", () => {
      const state: TabsState = { openIds: ["s1"], activeId: "s1" };
      const next = tabsReducer(state, { type: "CLOSE_TAB", sessionId: "x" });
      expect(next).toEqual(state);
    });

    it("falls back to the right neighbor when closing the active tab", () => {
      const state: TabsState = { openIds: ["s1", "s2", "s3"], activeId: "s2" };
      const next = tabsReducer(state, { type: "CLOSE_TAB", sessionId: "s2" });

      expect(next.openIds).toEqual(["s1", "s3"]);
      expect(next.activeId).toBe("s3");
    });

    it("falls back to the left neighbor when no right neighbor exists", () => {
      const state: TabsState = { openIds: ["s1", "s2", "s3"], activeId: "s3" };
      const next = tabsReducer(state, { type: "CLOSE_TAB", sessionId: "s3" });

      expect(next.openIds).toEqual(["s1", "s2"]);
      expect(next.activeId).toBe("s2");
    });

    it("clears activeId when closing the only tab", () => {
      const state: TabsState = { openIds: ["s1"], activeId: "s1" };
      const next = tabsReducer(state, { type: "CLOSE_TAB", sessionId: "s1" });

      expect(next.openIds).toEqual([]);
      expect(next.activeId).toBeNull();
    });
  });

  describe("SWITCH_TAB", () => {
    it("sets activeId when sessionId is in openIds", () => {
      const state: TabsState = { openIds: ["s1", "s2"], activeId: "s1" };
      const next = tabsReducer(state, { type: "SWITCH_TAB", sessionId: "s2" });

      expect(next.activeId).toBe("s2");
      expect(next.openIds).toEqual(["s1", "s2"]);
    });

    it("returns the same state when sessionId is not in openIds", () => {
      const state: TabsState = { openIds: ["s1", "s2"], activeId: "s1" };
      const next = tabsReducer(state, { type: "SWITCH_TAB", sessionId: "x" });
      expect(next).toEqual(state);
    });
  });
});
