import {
  Calendar,
  Code2,
  FolderKanban,
  Mail,
  MessageSquare,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { useToastStore } from "@/features/toasts/toastStore";

export type AppId = "chat" | "email" | "calendar" | "projects" | "editor";

interface AppSlot {
  id: AppId;
  label: string;
  icon: LucideIcon;
  live: boolean;
}

const APP_SLOTS: AppSlot[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, live: true },
  { id: "email", label: "Email", icon: Mail, live: false },
  { id: "calendar", label: "Calendar", icon: Calendar, live: false },
  { id: "projects", label: "Projects", icon: FolderKanban, live: false },
  { id: "editor", label: "Editor", icon: Code2, live: false },
];

interface RibbonProps {
  activeApp: AppId;
  onActivate: (id: AppId) => void;
}

const railStyle: CSSProperties = {
  width: 44,
  flex: "0 0 44px",
  height: "100%",
  background: "var(--color-bg)",
  borderRight: "1px solid var(--color-border-subtle)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "var(--space-2) 0",
  userSelect: "none",
};

const groupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
};

const slotButtonStyle = (active: boolean): CSSProperties => ({
  position: "relative",
  width: 32,
  height: 32,
  borderRadius: "var(--radius-sm)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: active ? "var(--color-accent-dim)" : "transparent",
  border: 0,
  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
  cursor: "pointer",
});

const indicatorStyle: CSSProperties = {
  position: "absolute",
  left: -7,
  top: 6,
  bottom: 6,
  width: 2,
  background: "var(--color-accent)",
  borderRadius: "0 2px 2px 0",
};

export const Ribbon = ({ activeApp, onActivate }: RibbonProps) => {
  const addToast = useToastStore((s) => s.addToast);

  const handleSlotClick = (slot: AppSlot) => {
    if (slot.live) {
      onActivate(slot.id);
    } else {
      addToast(`${slot.label} — coming soon`);
    }
  };

  return (
    <div data-testid="zone-ribbon" style={railStyle}>
      <div data-testid="ribbon-apps" style={groupStyle}>
        {APP_SLOTS.map((slot) => {
          const active = slot.id === activeApp;
          const Icon = slot.icon;
          return (
            <button
              key={slot.id}
              type="button"
              data-testid={`ribbon-app-${slot.id}`}
              data-app-id={slot.id}
              data-active={String(active)}
              title={slot.live ? slot.label : `${slot.label} (coming soon)`}
              onClick={() => handleSlotClick(slot)}
              style={slotButtonStyle(active)}
            >
              {active && <span style={indicatorStyle} aria-hidden="true" />}
              <Icon size={16} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div data-testid="ribbon-footer" style={groupStyle}>
        <button
          type="button"
          data-testid="ribbon-plugins"
          aria-label="Plugin marketplace"
          title="Plugin marketplace (coming soon)"
          onClick={() => addToast("Plugin marketplace — coming soon")}
          style={slotButtonStyle(false)}
        >
          <Plug size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          data-testid="ribbon-settings"
          aria-label="Settings"
          title="Settings (coming soon)"
          onClick={() => addToast("Settings — coming soon")}
          style={slotButtonStyle(false)}
        >
          <Settings size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
