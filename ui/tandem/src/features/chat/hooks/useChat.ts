import { useCallback } from "react";

import { acpSendMessage } from "@/shared/api/acp";
import { resolvePath } from "@/shared/api/pathResolver";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useChatStore } from "@/features/chat/stores/chatStore";
import {
  DRAFT_TAB_PREFIX,
  useTabsStore,
} from "@/features/tabs/stores/tabsStore";
import { createUserMessage } from "@/shared/types/messages";

const isDraftId = (id: string) => id.startsWith(DRAFT_TAB_PREFIX);

async function defaultWorkingDir(): Promise<string> {
  const { path } = await resolvePath({ parts: ["~", ".goose", "artifacts"] });
  return path;
}

export interface UseChatResult {
  send: (text: string) => Promise<void>;
  hasMessages: boolean;
}

export function useChat(tabId: string | null): UseChatResult {
  const messages = useChatStore((s) =>
    tabId ? s.messagesBySession[tabId] : undefined,
  );

  const send = useCallback(
    async (text: string) => {
      if (!tabId) return;

      let sessionId = tabId;
      if (isDraftId(tabId)) {
        const workingDir = await defaultWorkingDir();
        const session = await useChatSessionStore
          .getState()
          .createSession({ workingDir });
        sessionId = session.id;
        useTabsStore.getState().replaceTab(tabId, sessionId);
      }

      useChatStore.getState().addMessage(sessionId, createUserMessage(text));
      await acpSendMessage(sessionId, text);
    },
    [tabId],
  );

  return {
    send,
    hasMessages: (messages?.length ?? 0) > 0,
  };
}
