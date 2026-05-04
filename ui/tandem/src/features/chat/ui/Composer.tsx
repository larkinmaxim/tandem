import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Brain, ChevronDown, FileText, Paperclip, Plug, X } from "lucide-react";

export interface ComposerAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface ComposerProps {
  placeholder?: string;
  onSend?: (text: string, attachments: ComposerAttachment[]) => void;
  disabled?: boolean;
  contextFolder?: string;
  mcpCount?: number;
  tokenUsed?: number;
  tokenLimit?: number;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("FileReader result was not a string"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatTokens(used: number, limit: number): string {
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  return `${fmt(used)} / ${fmt(limit)}`;
}

function tokenColor(used: number, limit: number): string {
  if (limit <= 0) return "var(--color-success, #4ade80)";
  const ratio = used / limit;
  if (ratio >= 0.8) return "var(--color-danger, #ef4444)";
  if (ratio >= 0.6) return "var(--color-warning, #f59e0b)";
  return "var(--color-success, #4ade80)";
}

export const Composer = ({
  placeholder = "Ask anything, or paste a file…",
  onSend,
  disabled = false,
  contextFolder = "Default",
  mcpCount = 0,
  tokenUsed = 0,
  tokenLimit = 0,
}: ComposerProps) => {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const next = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        data: await readAsBase64(file),
      })),
    );
    setAttachments((prev) => [...prev, ...next]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSend?.(trimmed, attachments);
      setValue("");
      setAttachments([]);
    }
  };

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
      {attachments.length > 0 && (
        <div
          data-testid="chat-composer-attachments"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {attachments.map((a, i) => (
            <div
              key={`${a.name}-${i}`}
              data-testid="chat-composer-attachment-chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                background: "var(--color-raised)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 999,
                color: "var(--color-text-muted)",
                fontSize: 12,
              }}
            >
              <FileText size={11} />
              <span>{a.name}</span>
              <button
                type="button"
                data-testid="chat-composer-attachment-remove"
                aria-label={`Remove ${a.name}`}
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, j) => j !== i))
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <textarea
        data-testid="chat-composer-input"
        placeholder={placeholder}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
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
          ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
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
        <button
          type="button"
          data-testid="chat-composer-attach"
          aria-label="Attach file"
          title="Attach file"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            padding: 0,
            ...(disabled
              ? { opacity: 0.5, cursor: "not-allowed" }
              : { cursor: "pointer" }),
          }}
        >
          <Paperclip size={13} />
        </button>
        <input
          ref={fileInputRef}
          data-testid="chat-composer-attach-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div style={{ flex: 1 }} />
        <div
          data-testid="chat-composer-context-folder"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--color-text-muted)",
          }}
        >
          <Brain size={12} />
          <span>{contextFolder}</span>
          <ChevronDown size={10} />
        </div>
        <div
          data-testid="chat-composer-token-counter"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "var(--color-border-subtle)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${tokenLimit > 0 ? Math.min(100, (tokenUsed / tokenLimit) * 100) : 0}%`,
                height: "100%",
                borderRadius: 2,
                background: tokenColor(tokenUsed, tokenLimit),
              }}
            />
          </div>
          <span style={{ color: tokenColor(tokenUsed, tokenLimit) }}>
            {formatTokens(tokenUsed, tokenLimit)}
          </span>
        </div>
        <div
          data-testid="chat-composer-mcp-count"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--color-text-muted)",
          }}
        >
          <Plug size={12} />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              background: "var(--color-accent)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              padding: "0 4px",
            }}
          >
            {mcpCount}
          </span>
        </div>
      </div>
    </div>
  );
};
