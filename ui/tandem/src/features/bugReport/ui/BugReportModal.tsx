import { useState } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

const REPO_URL = "https://github.com/larkinmaxim/tandem";
const MIN_TITLE_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 8000;

function buildIssueUrl(title: string, description: string): string {
  const params = new URLSearchParams();
  params.set("title", title.trim());
  if (description.trim()) {
    params.set("body", description.trim());
  }
  return `${REPO_URL}/issues/new?${params.toString()}`;
}

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { t } = useTranslation("bugReport");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length >= MIN_TITLE_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const url = buildIssueUrl(trimmedTitle, description);
    await openUrl(url);
    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            />
            {title.length > 0 && !canSubmit && (
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
              onChange={(e) =>
                setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
              }
              placeholder={t("modal.descriptionPlaceholder")}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("modal.cancel")}
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {t("modal.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { buildIssueUrl, MIN_TITLE_LENGTH };
