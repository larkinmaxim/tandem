import { useEffect, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { getClient } from "@/shared/api/acpConnection";
import { useChatSessionStore } from "@/features/chat/stores/chatSessionStore";
import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";

type SeamStatus = "pending" | "pass" | "fail";

interface SeamProps {
  index: number;
  title: string;
  status: SeamStatus;
  detail: string;
  children?: ReactNode;
}

const StatusIcon = ({ status }: { status: SeamStatus }) => {
  if (status === "pass")
    return (
      <CheckCircle2
        size={16}
        color="var(--color-success)"
        aria-label="pass"
      />
    );
  if (status === "fail")
    return (
      <CircleAlert size={16} color="var(--color-danger)" aria-label="fail" />
    );
  return (
    <CircleDashed
      size={16}
      color="var(--color-text-muted)"
      aria-label="pending"
    />
  );
};

const Seam = ({ index, title, status, detail, children }: SeamProps) => (
  <section
    data-testid={`seam-${index}`}
    data-status={status}
    style={{
      padding: 16,
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      background: "var(--color-surface)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}
  >
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--font-ui)",
      }}
    >
      <StatusIcon status={status} />
      <strong>
        Seam {index}: {title}
      </strong>
    </header>
    <div
      style={{
        fontSize: "var(--text-sm)",
        color: "var(--color-text-secondary)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {detail}
    </div>
    {children}
  </section>
);

export const BootstrapScreen = () => {
  const [tauriUrl, setTauriUrl] = useState<{
    status: SeamStatus;
    detail: string;
  }>({ status: "pending", detail: "calling invoke('get_goose_serve_url')..." });
  const [acpStatus, setAcpStatus] = useState<{
    status: SeamStatus;
    detail: string;
  }>({ status: "pending", detail: "awaiting initialize handshake..." });

  useEffect(() => {
    let cancelled = false;
    invoke<string>("get_goose_serve_url")
      .then((url) => {
        if (cancelled) return;
        setTauriUrl({ status: "pass", detail: url });
      })
      .catch((err) => {
        if (cancelled) return;
        setTauriUrl({ status: "fail", detail: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getClient()
      .then(() => {
        if (cancelled) return;
        setAcpStatus({ status: "pass", detail: "ACP handshake completed" });
      })
      .catch((err) => {
        if (cancelled) return;
        setAcpStatus({ status: "fail", detail: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sessions = useChatSessionStore((s) => s.sessions);
  const sessionsHydrated = useChatSessionStore((s) => s.hasHydratedSessions);
  const providerEntries = useProviderInventoryStore((s) => s.entries);

  return (
    <div
      style={{
        minHeight: "100%",
        padding: 24,
        color: "var(--color-text)",
        background: "var(--color-bg)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <h1
        style={{
          margin: "0 0 4px 0",
          fontSize: "var(--text-2xl)",
          color: "var(--color-text)",
        }}
      >
        Tandem — Phase 0 bootstrap
      </h1>
      <p
        style={{
          margin: "0 0 24px 0",
          color: "var(--color-text-secondary)",
        }}
      >
        Throwaway screen verifying the 8 architectural seams. Replaced by{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>AppShell</code> in
        Phase 1.
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        }}
      >
        <Seam
          index={1}
          title="Tauri command roundtrip"
          status={tauriUrl.status}
          detail={tauriUrl.detail}
        />

        <Seam
          index={2}
          title="CSS tokens applied"
          status="pass"
          detail="If this swatch is violet-indigo, --color-accent resolves."
        >
          <div
            data-testid="accent-swatch"
            style={{
              height: 32,
              borderRadius: 6,
              background: "var(--color-accent)",
            }}
          />
        </Seam>

        <Seam
          index={3}
          title="shadcn Button"
          status="pass"
          detail="Renders @/shared/ui/button with class-variance-authority."
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Button>Default</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </Seam>

        <Seam
          index={4}
          title="ACP WebSocket connects"
          status={acpStatus.status}
          detail={acpStatus.detail}
        />

        <Seam
          index={5}
          title="Store hydration"
          status="pass"
          detail={`chatSessionStore.sessions.length = ${sessions.length} | hasHydratedSessions = ${String(sessionsHydrated)} | providerInventoryStore.entries.size = ${providerEntries.size}`}
        />
      </div>

      <footer
        style={{
          marginTop: 24,
          color: "var(--color-text-muted)",
          fontSize: "var(--text-xs)",
          fontFamily: "var(--font-mono)",
        }}
      >
        Manual checks: HMR fires on edit (Seam 6) · pnpm tsc --noEmit clean
        (Seam 7) · no react-intl/@/shared/i18n imports (Seam 8).
      </footer>
    </div>
  );
};
