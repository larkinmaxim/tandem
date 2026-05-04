import { Sparkles } from "lucide-react";
import { StickToBottom } from "use-stick-to-bottom";

import { useChatStore } from "@/features/chat/stores/chatStore";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useAgentStore } from "@/features/agents/stores/agentStore";
import { getUserInitials } from "@/features/chat/lib/userIdentity";
import {
  getTextContent,
  isTextContent,
  isToolRequest,
  isToolResponse,
  isThinking,
  isReasoning,
  type Message,
  type MessageContent,
  type ToolRequestContent,
  type ToolResponseContent,
} from "@/shared/types/messages";
import type { ChatState } from "@/shared/types/chat";

const FALLBACK_PERSONA_NAME = "Tandem";

function usePersonaNameForSession(sessionId: string): string {
  const personaId = useChatSessionStore(
    (s) => s.sessions.find((x) => x.id === sessionId)?.personaId,
  );
  const personaName = useAgentStore((s) =>
    personaId ? s.personas.find((p) => p.id === personaId)?.displayName : undefined,
  );
  return personaName ?? FALLBACK_PERSONA_NAME;
}

export interface TimelineProps {
  sessionId: string;
}

const EMPTY_MESSAGES: Message[] = [];

const ASSISTANT_BUSY_STATES: ReadonlySet<ChatState> = new Set([
  "thinking",
  "streaming",
]);

export const Timeline = ({ sessionId }: TimelineProps) => {
  const messages = useChatStore(
    (s) => s.messagesBySession[sessionId] ?? EMPTY_MESSAGES,
  );
  const chatState = useChatStore(
    (s) => s.sessionStateById[sessionId]?.chatState ?? "idle",
  );
  const personaName = usePersonaNameForSession(sessionId);
  const showTypingIndicator = ASSISTANT_BUSY_STATES.has(chatState);

  return (
    <StickToBottom
      className="relative flex-1 overflow-y-hidden"
      initial="smooth"
      resize="smooth"
      role="log"
      data-testid="chat-timeline"
    >
      <StickToBottom.Content
        className="flex flex-col gap-3 p-4"
      >
        {messages.map((m) => (
          <MessageRow key={m.id} message={m} personaName={personaName} />
        ))}
        {showTypingIndicator && <TypingIndicator />}
      </StickToBottom.Content>
    </StickToBottom>
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

const ToolBlock = ({ content }: { content: ToolRequestContent }) => (
  <details
    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
    data-testid={`chat-tool-${content.id}`}
  >
    <summary className="cursor-pointer px-3 py-2 font-medium text-[var(--color-text-secondary)]">
      {content.name}
      {content.status === "completed" && (
        <span className="ml-2 text-xs text-[var(--color-success)]">✓</span>
      )}
      {content.status === "error" && (
        <span className="ml-2 text-xs text-[var(--color-danger)]">✗</span>
      )}
    </summary>
    <div className="border-t border-[var(--color-border)] px-3 py-2">
      <pre className="overflow-auto whitespace-pre-wrap text-xs font-[var(--font-mono)] text-[var(--color-text-muted)]">
        {JSON.stringify(content.arguments, null, 2)}
      </pre>
    </div>
  </details>
);

const ToolResponseBlock = ({ content }: { content: ToolResponseContent }) => (
  <div
    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs"
    data-testid={`chat-tool-response-${content.id}`}
  >
    <pre className="overflow-auto whitespace-pre-wrap font-[var(--font-mono)] text-[var(--color-text-muted)]">
      {content.result}
    </pre>
  </div>
);

const ThinkingBlock = ({ text }: { text: string }) => (
  <details className="text-sm text-[var(--color-text-muted)]" data-testid="chat-thinking">
    <summary className="cursor-pointer font-medium">Thinking...</summary>
    <div className="mt-1 whitespace-pre-wrap pl-4 text-xs opacity-75">{text}</div>
  </details>
);

const ContentBlock = ({ block }: { block: MessageContent }) => {
  if (isTextContent(block)) {
    return (
      <div className="prose prose-sm max-w-none font-[var(--font-reading)] text-[var(--color-text)] leading-relaxed [&_code]:rounded [&_code]:bg-[var(--color-surface)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-[var(--font-mono)] [&_code]:text-xs [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-[var(--color-surface)] [&_pre]:p-3 [&_pre]:font-[var(--font-mono)] [&_pre]:text-xs">
        {block.text}
      </div>
    );
  }
  if (isToolRequest(block)) return <ToolBlock content={block} />;
  if (isToolResponse(block)) return <ToolResponseBlock content={block} />;
  if (isThinking(block) || isReasoning(block)) {
    return <ThinkingBlock text={block.text} />;
  }
  return null;
};

const MessageRow = ({
  message,
  personaName,
}: {
  message: Message;
  personaName: string;
}) => {
  const isAssistant = message.role === "assistant";
  const textOnly =
    message.content.length === 1 && isTextContent(message.content[0]);

  return (
    <div
      data-testid={`chat-message-${message.role}`}
      data-message-id={message.id}
      className="flex gap-2.5 items-start"
    >
      <Avatar message={message} />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        {isAssistant && (
          <div
            data-testid={`chat-message-persona-${message.id}`}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "var(--color-text)",
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {personaName}
          </div>
        )}
        {textOnly ? (
          <div className="font-[var(--font-reading)] text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
            {getTextContent(message)}
          </div>
        ) : (
          message.content.map((block, i) => (
            <ContentBlock key={`${message.id}-${i}`} block={block} />
          ))
        )}
      </div>
    </div>
  );
};
