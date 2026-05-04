import { AlertTriangle } from "lucide-react";

export const ProvidersBanner = () => (
  <div
    data-testid="providers-banner"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      background: "var(--color-warning-dim, rgba(245, 158, 11, 0.1))",
      border: "1px solid var(--color-warning, #f59e0b)",
      borderRadius: 8,
      margin: "8px 16px 0",
      color: "var(--color-text)",
      fontSize: 13,
      fontFamily: "var(--font-ui)",
      lineHeight: 1.4,
    }}
  >
    <AlertTriangle
      size={16}
      style={{ color: "var(--color-warning, #f59e0b)", flexShrink: 0 }}
    />
    <span>
      No providers configured. Open goose2 to set up an API key, then restart
      Tandem.
    </span>
  </div>
);
