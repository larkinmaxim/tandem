const translations: Record<string, string> = {
  "components.codeBlock.copyLabel": "Copy code",
  "components.messageBranch.previous": "Previous",
  "components.messageBranch.next": "Next",
  "components.messageBranch.page": "{{current}} / {{total}}",
  "components.plan.toggle": "Toggle plan",
  "components.stackTrace.copyLabel": "Copy stack trace",
  "components.stackTrace.empty": "No stack trace available",
  "components.terminal.title": "Terminal",
  "components.terminal.copyLabel": "Copy",
  "components.terminal.clearLabel": "Clear",
  "components.snippet.copyLabel": "Copy",
  "components.linkSafety.title": "External Link",
  "components.linkSafety.description":
    "You are about to open an external link. Are you sure you want to continue?",
  "components.linkSafety.copied": "Copied!",
  "components.linkSafety.copyLink": "Copy link",
  "components.linkSafety.openLink": "Open link",
  "components.environmentVariables.title": "Environment Variables",
  "components.environmentVariables.toggleVisibility": "Toggle visibility",
  "components.environmentVariables.copyLabel": "Copy value",
  "errors.clipboardUnavailable": "Clipboard unavailable",
  "labels.required": "Required",
  "usage.modelContext": "Model context",
  "usage.totalCost": "Total cost",
  "usage.input": "Input",
  "usage.output": "Output",
  "usage.reasoning": "Reasoning",
  "usage.cache": "Cache",
};

type TFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string;

const t: TFunction = (key, params) => {
  let result = translations[key] ?? key.split(".").pop() ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(`{{${k}}}`, String(v));
    }
  }
  return result;
};

export function useTranslation(_ns?: string) {
  return { t, i18n: { resolvedLanguage: "en", language: "en" } } as const;
}
