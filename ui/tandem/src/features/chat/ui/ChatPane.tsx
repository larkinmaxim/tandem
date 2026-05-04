import { useCallback } from "react";

import { acpSetModel } from "@/shared/api/acp";
import { useChat } from "@/features/chat/hooks/useChat";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { Composer } from "@/features/chat/ui/Composer";
import { EmptyState } from "@/features/chat/ui/EmptyState";
import type { ModelOption } from "@/features/chat/ui/ModelPicker";
import { ProvidersBanner } from "@/features/chat/ui/ProvidersBanner";
import { Timeline } from "@/features/chat/ui/Timeline";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";
import { useTabsStore } from "@/features/tabs/stores/tabsStore";

export const ChatPane = () => {
  const activeTabId = useTabsStore((s) => s.activeId);
  const { send, hasMessages } = useChat(activeTabId);
  const tokenState = useChatStore((s) =>
    activeTabId ? s.sessionStateById[activeTabId]?.tokenState : undefined,
  );
  const hasConfiguredProvider = useProviderInventoryStore((s) => {
    for (const entry of s.entries.values()) {
      if (entry.configured) return true;
    }
    return false;
  });

  const activeSession = useChatSessionStore((s) =>
    activeTabId ? s.sessions.find((sess) => sess.id === activeTabId) : undefined,
  );

  const handleModelSelect = useCallback(
    (option: ModelOption) => {
      if (!activeTabId) return;
      useChatSessionStore.getState().updateSession(activeTabId, {
        modelId: option.modelId,
        modelName: option.modelName,
        providerId: option.providerId,
      });
      void acpSetModel(activeTabId, option.modelId).catch((err: unknown) =>
        console.error("Failed to set model:", err),
      );
    },
    [activeTabId],
  );

  const modelPickerProps = {
    selectedModelId: activeSession?.modelId,
    selectedModelName: activeSession?.modelName,
    onModelSelect: handleModelSelect,
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {!hasConfiguredProvider && <ProvidersBanner />}
      {!activeTabId || !hasMessages ? (
        <EmptyState
          onSend={send}
          composerDisabled={!hasConfiguredProvider}
          {...modelPickerProps}
        />
      ) : (
        <div
          data-testid="chat-active"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Timeline sessionId={activeTabId} />
          <div
            style={{
              padding: "8px 16px 16px",
              borderTop: "1px solid var(--color-border-subtle)",
              background: "var(--color-canvas)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Composer
              onSend={send}
              tokenUsed={tokenState?.accumulatedTotal ?? 0}
              tokenLimit={tokenState?.contextLimit ?? 0}
              disabled={!hasConfiguredProvider}
              {...modelPickerProps}
            />
          </div>
        </div>
      )}
    </div>
  );
};
