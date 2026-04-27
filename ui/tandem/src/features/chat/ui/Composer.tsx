export interface ComposerProps {
  placeholder?: string;
}

export const Composer = ({
  placeholder = "Ask anything, or paste a file…",
}: ComposerProps) => {
  return (
    <div
      data-testid="chat-composer"
      style={{
        width: "100%",
        maxWidth: 720,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <textarea
        data-testid="chat-composer-input"
        placeholder={placeholder}
        rows={2}
        style={{
          width: "100%",
          minHeight: 44,
          background: "transparent",
          color: "var(--color-text)",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "var(--font-ui)",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      />
      <div
        data-testid="chat-composer-footer"
        style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--color-text-muted)",
          fontSize: 12,
        }}
      >
        {/* Stub footer — real chips land in Phase 3b */}
      </div>
    </div>
  );
};
