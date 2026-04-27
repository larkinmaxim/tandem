import { Sparkles } from "lucide-react";

import { useChatStore } from "@/features/chat/stores/chatStore";
import { getUserInitials } from "@/features/chat/lib/userIdentity";
import { getTextContent, type Message } from "@/shared/types/messages";

export interface TimelineProps {
  sessionId: string;
}

const EMPTY_MESSAGES: Message[] = [];

export const Timeline = ({ sessionId }: TimelineProps) => {
  const messages = useChatStore(
    (s) => s.messagesBySession[sessionId] ?? EMPTY_MESSAGES,
  );

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
        <MessageRow key={m.id} message={m} />
      ))}
    </div>
  );
};

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

const MessageRow = ({ message }: { message: Message }) => {
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
      <div
        style={{
          fontFamily: "var(--font-reading)",
          color: "var(--color-text)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.55,
          paddingTop: 4,
        }}
      >
        {getTextContent(message)}
      </div>
    </div>
  );
};
