import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Spinner } from "@/shared/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { revealInFileManager } from "@/shared/lib/fileManager";
import { getPlatform } from "@/shared/lib/platform";
import { emitBugReportSubmitted } from "../lib/telemetry";

const REPO_URL = "https://github.com/larkinmaxim/tandem";
const MIN_TITLE_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 8000;
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const TRUNCATION_SUFFIX = "... ({{n}} chars omitted)";

interface BundleResult {
  zipPath: string;
  manifest: string;
}

function buildIssueUrl(
  title: string,
  description: string,
  manifest: string,
): string {
  const params = new URLSearchParams();
  params.set("title", title.trim());

  let body = "";
  if (description.trim()) {
    let desc = description.trim();
    if (desc.length > MAX_DESCRIPTION_LENGTH) {
      const omitted = desc.length - MAX_DESCRIPTION_LENGTH;
      desc =
        desc.slice(0, MAX_DESCRIPTION_LENGTH) +
        TRUNCATION_SUFFIX.replace("{{n}}", String(omitted));
    }
    body = desc;
  }
  if (manifest) {
    body = body ? `${body}\n\n---\n\n${manifest}` : manifest;
  }
  if (body) {
    params.set("body", body);
  }
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getRevealLabel(t: (key: string) => string): string {
  const platform = getPlatform();
  if (platform === "mac") return t("toast.revealInFinder");
  if (platform === "windows") return t("toast.revealInExplorer");
  return t("toast.revealInFileManager");
}

function showSuccessToast(
  t: (key: string, opts?: Record<string, unknown>) => string,
  zipPath: string,
  zipFilename: string,
  browserFailed: boolean,
) {
  const message = browserFailed
    ? t("toast.browserFailed")
    : t("toast.success", { filename: zipFilename });

  toast(message, {
    duration: Infinity,
    action: {
      label: getRevealLabel(t),
      onClick: () => void revealInFileManager(zipPath),
    },
    cancel: {
      label: t("toast.copyPath"),
      onClick: () => void navigator.clipboard.writeText(zipPath),
    },
  });
}

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { t } = useTranslation("bugReport");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length >= MIN_TITLE_LENGTH && !submitting;
  const showTruncation = description.length > MAX_DESCRIPTION_LENGTH;

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let hasImage = false;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          hasImage = true;
          const blob = item.getAsFile();
          if (!blob) continue;

          if (blob.size > MAX_SCREENSHOT_BYTES) {
            const sizeMb = Math.round(blob.size / (1024 * 1024));
            setScreenshotError(
              t("modal.screenshotTooLarge", { size: sizeMb }),
            );
            e.preventDefault();
            return;
          }

          setScreenshotError(null);
          const base64 = await blobToBase64(blob);
          setScreenshots((prev) => [...prev, base64]);
        }
      }

      if (hasImage) {
        e.preventDefault();
      }
    },
    [t],
  );

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await invoke<BundleResult>("bundle_bug_report", {
        screenshots,
      });

      const url = buildIssueUrl(trimmedTitle, description, result.manifest);
      const zipFilename = result.zipPath.split(/[/\\]/).pop() ?? "bundle.zip";

      let browserFailed = false;
      try {
        await openUrl(url);
      } catch {
        browserFailed = true;
        await navigator.clipboard.writeText(url).catch(() => {});
      }

      void emitBugReportSubmitted({
        has_description: description.trim().length > 0,
        has_screenshot: screenshots.length > 0,
        has_session: false,
      });

      setTitle("");
      setDescription("");
      setScreenshots([]);
      setScreenshotError(null);
      onOpenChange(false);

      showSuccessToast(t, result.zipPath, zipFilename, browserFailed);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      setError(t("modal.error", { reason }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    setTitle("");
    setDescription("");
    setScreenshots([]);
    setScreenshotError(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>{t("modal.title")}</DialogTitle>
          <DialogDescription>{t("modal.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-report-title">{t("modal.titleLabel")}</Label>
            <Input
              id="bug-report-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("modal.titlePlaceholder")}
              disabled={submitting}
            />
            {title.length > 0 && trimmedTitle.length < MIN_TITLE_LENGTH && (
              <p className="text-xs text-destructive">
                {t("modal.titleValidation")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bug-report-description">
              {t("modal.descriptionLabel")}
            </Label>
            <Textarea
              id="bug-report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onPaste={handlePaste}
              placeholder={t("modal.descriptionPlaceholder")}
              rows={4}
              disabled={submitting}
            />
            {showTruncation && (
              <p className="text-xs text-amber-600">
                {t("modal.truncationNotice", {
                  limit: MAX_DESCRIPTION_LENGTH,
                  excess: description.length - MAX_DESCRIPTION_LENGTH,
                })}
              </p>
            )}
          </div>

          {screenshotError && (
            <p className="text-xs text-destructive">{screenshotError}</p>
          )}

          {screenshots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {screenshots.map((_, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                >
                  📎 {t("modal.screenshotChip", { index: i + 1 })}
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    aria-label={t("modal.removeScreenshot", { index: i + 1 })}
                    disabled={submitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            {t("modal.cancel")}
          </Button>
          {error ? (
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {t("modal.retry")}
            </Button>
          ) : (
            <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
              {submitting ? (
                <>
                  <Spinner className="mr-2" />
                  {t("modal.submitting")}
                </>
              ) : (
                t("modal.submit")
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { buildIssueUrl, blobToBase64, MIN_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH };
