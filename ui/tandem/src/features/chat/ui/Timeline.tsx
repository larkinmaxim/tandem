import { Sparkles } from "lucide-react";

import { useChatStore } from "@/features/chat/stores/chatStore";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useAgentStore } from "@/features/agents/stores/agentStore";
import { getUserInitials } from "@/features/chat/lib/userIdentity";
import { getTextContent, type Message } from "@/shared/types/messages";
import type { ChatState } from "@/shared/types/chat";

export interface TimelineProps {
  sessionId: string;
}

const EMPTY_MESSAGES: Message[] = [];

const ASSISTANT_BUSY_STATES: ReadonlySet<ChatState> = new Set([
  "thinking",
  "streaming",
]);

function usePersonaNameForSession(sessionId: string): string {
  const personaId = useChatSessionStore(
    (s) => s.sessions.find((sess) => sess.id === sessionId)?.personaId,
  );
  const personaName = useAgentStore((s) =>
    personaId ? s.personas.find((p) => p.id === personaId)?.displayName : undefined,
  );
  return personaName ?? "Tandem";
}

export const Timeline = ({ sessionId }: TimelineProps) => {
  const messages = useChatStore(
    (s) => s.messagesBySession[sessionId] ?? EMPTY_MESSAGES,
  );
  const chatState = useChatStore(
    (s) => s.sessionStateById[sessionId]?.chatState ?? "idle",
  );
  const showTypingIndicator = ASSISTANT_BUSY_STATES.has(chatState);
  const personaName = usePersonaNameForSession(sessionId);

  return (
    <div
      data-testid="chat-timeline"
      style={{
        flex: 1,
        overflow: "auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {messages.map((m) => (
        <MessageRow key={m.id} message={m} personaName={personaName} />
      ))}
      {showTypingIndicator && <TypingIndicator />}
    </div>
  );
};

const TypingIndicator = () => (
  <div
    data-testid="chat-typing-indicator"
    style={{
      display: "flex",
      gap: 10,
      alignItems: "center",
      color: "var(--color-text-muted)",
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--color-raised)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Sparkles size={14} />
    </div>
    <span
      style={{
        display: "inline-flex",
        gap: 3,
        fontSize: 18,
        letterSpacing: 1,
      }}
    >
      <Dot delay={0} />
      <Dot delay={0.15} />
      <Dot delay={0.3} />
    </span>
  </div>
);

const Dot = ({ delay }: { delay: number }) => (
  <span
    style={{
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "currentColor",
      animation: `tandem-typing 1s infinite ${delay}s`,
      opacity: 0.3,
    }}
  />
);

const AVATAR_SIZE = 28;

const Avatar = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";
  return (
    <div
      data-testid={`chat-avatar-${message.id}`}
      data-role={message.role}
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: "50%",
        background: isUser ? "var(--color-accent)" : "var(--color-raised)",
        color: "var(--color-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {isUser ? getUserInitials() : <Sparkles size={14} />}
    </div>
  );
};

const MessageRow = ({
  message,
  personaName,
}: {
  message: Message;
  personaName: string;
}) => {
  return (
    <div
      data-testid={`chat-message-${message.role}`}
      data-message-id={message.id}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <Avatar message={message} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {message.role === "assistant" && (
          <div
            data-testid={`chat-message-persona-${message.id}`}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--color-text)",
              marginBottom: 2,
            }}
          >
            {personaName}
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--font-reading)",
            color: "var(--color-text)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.55,
            paddingTop: message.role === "assistant" ? 0 : 4,
          }}
        >
          {getTextContent(message)}
        </div>
      </div>
    </div>
  );
};
