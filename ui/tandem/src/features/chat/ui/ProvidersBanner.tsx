import { AlertTriangle } from "lucide-react";

export const ProvidersBanner = () => {
  return (
    <div
      data-testid="chat-providers-banner"
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 16px",
        background: "var(--color-warning-dim)",
        borderBottom: "1px solid var(--color-warning)",
        color: "var(--color-text)",
        fontFamily: "var(--font-ui)",
        fontSize: 13,
      }}
    >
      <AlertTriangle
        size={16}
        color="var(--color-warning)"
        aria-hidden="true"
      />
      <span>
        No providers configured. Open goose2 to set up an API key, then
        restart Tandem.
      </span>
    </div>
  );
};
