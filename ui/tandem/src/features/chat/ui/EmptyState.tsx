import { getTimeOfDay } from "@/features/chat/lib/timeOfDay";
import { DEFAULT_USER_NAME } from "@/features/chat/lib/userIdentity";

export interface EmptyStateProps {
  name?: string;
}

export const EmptyState = ({ name = DEFAULT_USER_NAME }: EmptyStateProps) => {
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
        gap: 16,
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
    </div>
  );
};
