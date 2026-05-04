import { useChat } from "@/features/chat/hooks/useChat";
import { useChatStore } from "@/features/chat/stores/chatStore";
import { Composer } from "@/features/chat/ui/Composer";
import { EmptyState } from "@/features/chat/ui/EmptyState";
import { ProvidersBanner } from "@/features/chat/ui/ProvidersBanner";
import { Timeline } from "@/features/chat/ui/Timeline";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";
import { useTabsStore } from "@/features/tabs/stores/tabsStore";

function useHasConfiguredProvider(): boolean {
  return useProviderInventoryStore((s) => {
    for (const entry of s.entries.values()) {
      if ((entry as Record<string, unknown>).configured) return true;
    }
    return false;
  });
}

export const ChatPane = () => {
  const activeTabId = useTabsStore((s) => s.activeId);
  const { send, hasMessages } = useChat(activeTabId);
  const hasConfiguredProvider = useHasConfiguredProvider();
  const showBanner = !hasConfiguredProvider;

  const tokenState = useChatStore(
    (s) => (activeTabId ? s.sessionStateById[activeTabId]?.tokenState : undefined),
  );

  const composerDisabled = !hasConfiguredProvider;

  if (!activeTabId || !hasMessages) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {showBanner && <ProvidersBanner />}
        <EmptyState onSend={send} composerDisabled={composerDisabled} />
      </div>
    );
  }

  return (
    <div
      data-testid="chat-active"
      style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      {showBanner && <ProvidersBanner />}
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
          disabled={composerDisabled}
          tokenUsed={tokenState?.accumulatedTotal ?? 0}
          tokenLimit={tokenState?.contextLimit ?? 0}
        />
      </div>
    </div>
  );
};
