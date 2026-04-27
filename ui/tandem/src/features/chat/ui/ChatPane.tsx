import { useChat } from "@/features/chat/hooks/useChat";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { Composer } from "@/features/chat/ui/Composer";
import { EmptyState } from "@/features/chat/ui/EmptyState";
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
            />
          </div>
        </div>
      )}
    </div>
  );
};
