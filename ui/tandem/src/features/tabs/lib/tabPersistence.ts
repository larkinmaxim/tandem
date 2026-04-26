import { initialTabsState, type TabsState } from "./tabsReducer";

export const TABS_STORAGE_KEY = "tandem.tabs.v1";

interface PersistedShape {
  openIds: string[];
  activeId: string | null;
}

export function saveTabsState(state: TabsState): void {
  const payload: PersistedShape = {
    openIds: state.openIds,
    activeId: state.activeId,
  };
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable / quota — silent: persistence is best-effort
  }
}

export function loadTabsState(
  sessionExists: (id: string) => boolean,
): TabsState {
  let raw: string | null;
  try {
    raw = localStorage.getItem(TABS_STORAGE_KEY);
  } catch {
    return initialTabsState;
  }
  if (raw == null) return initialTabsState;

  let parsed: PersistedShape;
  try {
    parsed = JSON.parse(raw) as PersistedShape;
  } catch {
    return initialTabsState;
  }

  const openIds = (parsed.openIds ?? []).filter(sessionExists);
  const activeId =
    parsed.activeId != null && openIds.includes(parsed.activeId)
      ? parsed.activeId
      : null;

  return { openIds, activeId };
}
