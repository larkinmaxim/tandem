export interface TabsState {
  openIds: string[];
  activeId: string | null;
}

export type TabsAction =
  | { type: "OPEN_TAB"; sessionId: string }
  | { type: "CLOSE_TAB"; sessionId: string }
  | { type: "SWITCH_TAB"; sessionId: string };

export const initialTabsState: TabsState = {
  openIds: [],
  activeId: null,
};

export function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  switch (action.type) {
    case "OPEN_TAB": {
      const alreadyOpen = state.openIds.includes(action.sessionId);
      return {
        openIds: alreadyOpen
          ? state.openIds
          : [...state.openIds, action.sessionId],
        activeId: action.sessionId,
      };
    }
    case "CLOSE_TAB": {
      const idx = state.openIds.indexOf(action.sessionId);
      if (idx === -1) return state;
      const openIds = state.openIds.filter((id) => id !== action.sessionId);
      let activeId = state.activeId;
      if (state.activeId === action.sessionId) {
        if (openIds.length === 0) {
          activeId = null;
        } else if (idx < openIds.length) {
          activeId = openIds[idx];
        } else {
          activeId = openIds[openIds.length - 1];
        }
      }
      return { openIds, activeId };
    }
    case "SWITCH_TAB": {
      if (!state.openIds.includes(action.sessionId)) return state;
      if (state.activeId === action.sessionId) return state;
      return { ...state, activeId: action.sessionId };
    }
    default:
      return state;
  }
}
