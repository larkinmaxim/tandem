import { useChatStore } from "@/features/chat/stores/chatStore";
import { getTextContent, type Message } from "@/shared/types/messages";

export interface TimelineProps {
  sessionId: string;
}

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

const EMPTY_MESSAGES: Message[] = [];

const MessageRow = ({ message }: { message: Message }) => {
  return (
    <div
      data-testid={`chat-message-${message.role}`}
      data-message-id={message.id}
      style={{
        fontFamily: "var(--font-reading)",
        color: "var(--color-text)",
        whiteSpace: "pre-wrap",
      }}
    >
      {getTextContent(message)}
    </div>
  );
};
