import { useMemo } from "react";

const DEFAULT_LOCALE = "en-US";

function formatDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

function formatDateParts(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
): Intl.DateTimeFormatPart[] {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).formatToParts(date);
}

function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
}

function formatRelativeTimeToNow(
  value: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  _options?: Intl.RelativeTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, "day");
  if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, "hour");
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, "minute");
  return rtf.format(diffSec, "second");
}

function getTimeParts(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: string = DEFAULT_LOCALE,
) {
  const parts = formatDateParts(value, options, locale);
  return {
    hour: parts.find((part) => part.type === "hour")?.value ?? "",
    minute: parts.find((part) => part.type === "minute")?.value ?? "",
    dayPeriod: parts.find((part) => part.type === "dayPeriod")?.value,
  };
}

export function useLocaleFormatting() {
  const locale = DEFAULT_LOCALE;

  return useMemo(
    () => ({
      locale,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, options, locale),
      formatDate: (
        value: Date | string | number,
        options?: Intl.DateTimeFormatOptions,
      ) => formatDate(value, options, locale),
      formatDateParts: (
        value: Date | string | number,
        options?: Intl.DateTimeFormatOptions,
      ) => formatDateParts(value, options, locale),
      formatRelativeTime: (
        value: number,
        unit: Intl.RelativeTimeFormatUnit,
        options?: Intl.RelativeTimeFormatOptions,
      ) => formatRelativeTime(value, unit, options, locale),
      formatRelativeTimeToNow: (
        value: Date | string | number,
        options?: Intl.RelativeTimeFormatOptions,
      ) => formatRelativeTimeToNow(value, locale, options),
      getTimeParts: (
        value: Date | string | number,
        options?: Intl.DateTimeFormatOptions,
      ) => getTimeParts(value, options, locale),
    }),
    [],
  );
}
