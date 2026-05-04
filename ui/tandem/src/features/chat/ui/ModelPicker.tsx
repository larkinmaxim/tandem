import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Bot } from "lucide-react";

import { useProviderInventoryStore } from "@/features/providers/stores/providerInventoryStore";

export interface ModelOption {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
}

export interface ModelPickerProps {
  selectedModelId?: string;
  selectedModelName?: string;
  onSelect: (option: ModelOption) => void;
  disabled?: boolean;
}

function useAvailableModels(): ModelOption[] {
  const entries = useProviderInventoryStore((s) => s.entries);
  return useMemo(() => {
    const options: ModelOption[] = [];
    for (const entry of entries.values()) {
      if (!entry.configured) continue;
      for (const model of entry.models ?? []) {
        options.push({
          providerId: entry.providerId,
          providerName: (entry as Record<string, unknown>).providerName as string ?? entry.providerId,
          modelId: model.id,
          modelName: model.name ?? model.id,
        });
      }
    }
    return options;
  }, [entries]);
}

export const ModelPicker = ({
  selectedModelId,
  selectedModelName,
  onSelect,
  disabled = false,
}: ModelPickerProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const models = useAvailableModels();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayName = selectedModelName || selectedModelId || "Select model";

  return (
    <div
      ref={containerRef}
      data-testid="model-picker"
      style={{ position: "relative", display: "inline-flex" }}
    >
      <button
        type="button"
        data-testid="model-picker-trigger"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 26,
          padding: "0 8px",
          borderRadius: 6,
          background: "transparent",
          border: "none",
          color: "var(--color-text-muted)",
          fontSize: 12,
          fontFamily: "var(--font-ui)",
          whiteSpace: "nowrap",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Bot size={13} />
        <span>{displayName}</span>
        <ChevronDown size={11} style={{ opacity: 0.6 }} />
      </button>

      {open && models.length > 0 && (
        <div
          data-testid="model-picker-dropdown"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 4,
            minWidth: 240,
            maxHeight: 300,
            overflowY: "auto",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 100,
            padding: 4,
          }}
        >
          {models.map((m) => {
            const isActive = m.modelId === selectedModelId;
            return (
              <button
                key={`${m.providerId}-${m.modelId}`}
                type="button"
                data-testid={`model-option-${m.modelId}`}
                onClick={() => {
                  onSelect(m);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: isActive ? "var(--color-raised)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--color-text)",
                  fontSize: 12,
                  fontFamily: "var(--font-ui)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{m.modelName}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-text-muted)",
                  }}
                >
                  {m.providerName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
