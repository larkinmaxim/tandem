import { getTimeOfDay } from "@/features/chat/lib/timeOfDay";
import { DEFAULT_USER_NAME } from "@/features/chat/lib/userIdentity";
import {
  Composer,
  type ComposerAttachment,
} from "@/features/chat/ui/Composer";

export interface EmptyStateProps {
  name?: string;
  onSend?: (text: string, attachments: ComposerAttachment[]) => void;
}

export const EmptyState = ({
  name = DEFAULT_USER_NAME,
  onSend,
}: EmptyStateProps) => {
  const tod = getTimeOfDay();
  return (
    <div
      data-testid="chat-empty-state"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 32,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-reading)",
          fontSize: 28,
          color: "var(--color-text)",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Good {tod}, <span style={{ color: "var(--color-accent)" }}>{name}</span>.
        <br />
        <em>What are we working on?</em>
      </div>
      <Composer onSend={onSend} />
    </div>
  );
};
