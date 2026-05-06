import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bug } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import { BugReportModal } from "./BugReportModal";

export function BugReportButton() {
  const { t } = useTranslation("bugReport");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(true)}
            aria-label={t("button.label")}
          >
            <Bug className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("button.label")}</TooltipContent>
      </Tooltip>
      <BugReportModal open={open} onOpenChange={setOpen} />
    </>
  );
}
