import { beforeEach, describe, expect, it } from "vitest";
import {
  TABS_STORAGE_KEY,
  loadTabsState,
  saveTabsState,
} from "../tabPersistence";

describe("tabPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("save → load round trip", () => {
    it("returns saved openIds and activeId when all sessions still exist", () => {
      saveTabsState({ openIds: ["s1", "s2"], activeId: "s2" });

      const loaded = loadTabsState(() => true);

      expect(loaded.openIds).toEqual(["s1", "s2"]);
      expect(loaded.activeId).toBe("s2");
    });

    it("writes under the documented storage key", () => {
      saveTabsState({ openIds: ["s1"], activeId: "s1" });
      expect(localStorage.getItem(TABS_STORAGE_KEY)).not.toBeNull();
    });
  });

  describe("load", () => {
    it("returns empty state when nothing has been persisted", () => {
      const loaded = loadTabsState(() => true);
      expect(loaded).toEqual({ openIds: [], activeId: null });
    });

    it("silently drops persisted ids whose sessions no longer exist", () => {
      saveTabsState({ openIds: ["s1", "stale", "s3"], activeId: "s3" });

      const loaded = loadTabsState((id) => id !== "stale");

      expect(loaded.openIds).toEqual(["s1", "s3"]);
      expect(loaded.activeId).toBe("s3");
    });

    it("nulls activeId when the persisted active session no longer exists", () => {
      saveTabsState({ openIds: ["s1", "stale"], activeId: "stale" });

      const loaded = loadTabsState((id) => id !== "stale");

      expect(loaded.openIds).toEqual(["s1"]);
      expect(loaded.activeId).toBeNull();
    });

    it("returns empty state when stored value is malformed JSON", () => {
      localStorage.setItem(TABS_STORAGE_KEY, "{not json");
      expect(loadTabsState(() => true)).toEqual({
        openIds: [],
        activeId: null,
      });
    });
  });
});
