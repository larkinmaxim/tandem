import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  Brain,
  ChevronDown,
  FileText,
  Paperclip,
  Plug,
  X,
} from "lucide-react";

export interface ComposerAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface ComposerProps {
  placeholder?: string;
  onSend?: (text: string, attachments: ComposerAttachment[]) => void;
  contextFolder?: string;
  mcpCount?: number;
  tokenUsed?: number;
  tokenLimit?: number;
}

function formatTokenCount(used: number, limit: number): string {
  if (limit <= 0) return String(used);
  const usedK = used / 1000;
  const usedStr = usedK.toFixed(used >= 10000 ? 0 : 1).replace(/\.0$/, "");
  const limitStr = (limit / 1000).toFixed(0);
  return `${usedStr}k / ${limitStr}k`;
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

const chipStyle = {
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
  whiteSpace: "nowrap" as const,
};

export const Composer = ({
  placeholder = "Ask anything, or paste a file…",
  onSend,
  contextFolder = "Default",
  mcpCount = 0,
  tokenUsed = 0,
  tokenLimit = 0,
}: ComposerProps) => {
  const tokenLabel = formatTokenCount(tokenUsed, tokenLimit);
  const tokenPct = tokenLimit > 0 ? Math.min(100, (tokenUsed / tokenLimit) * 100) : 0;
  const tokenFillColor =
    tokenPct > 80
      ? "var(--color-danger)"
      : tokenPct > 60
        ? "var(--color-warning)"
        : "var(--color-success)";
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
          gap: 2,
          color: "var(--color-text-muted)",
          fontSize: 12,
        }}
      >
        <div data-testid="chat-composer-context-folder" style={chipStyle}>
          <Brain size={13} />
          <span>{contextFolder}</span>
          <ChevronDown size={11} style={{ opacity: 0.6 }} />
        </div>
        <button
          type="button"
          data-testid="chat-composer-attach"
          aria-label="Attach file"
          title="Attach file"
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
            cursor: "pointer",
            padding: 0,
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
        <div data-testid="chat-composer-token-counter" style={chipStyle}>
          {tokenLimit > 0 && (
            <div
              style={{
                width: 40,
                height: 4,
                background: "var(--color-border)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${tokenPct}%`,
                  height: "100%",
                  background: tokenFillColor,
                }}
              />
            </div>
          )}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-faint)",
              fontSize: 11,
            }}
          >
            {tokenLabel}
          </span>
        </div>
        <div
          style={{
            width: 1,
            height: 16,
            background: "var(--color-border)",
            margin: "0 4px",
          }}
        />
        <div data-testid="chat-composer-mcp-count" style={chipStyle}>
          <Plug size={13} />
          <span>MCP</span>
          <span
            style={{
              background: "var(--color-accent-dim)",
              color: "var(--color-accent)",
              borderRadius: 999,
              padding: "1px 6px",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              minWidth: 16,
              textAlign: "center",
            }}
          >
            {mcpCount}
          </span>
          <ChevronDown size={11} style={{ opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
};
