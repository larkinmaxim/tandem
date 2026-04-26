import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_ROOT = join(__dirname, "..");
const FORBIDDEN = [
  /from\s+["']react-intl["']/,
  /from\s+["']@\/shared\/i18n(["'/])/,
  /useLocaleFormatting/,
];

const SELF = __filename;

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === "ds")
        continue;
      yield* walk(full);
      continue;
    }
    // Skip this test file itself — it contains the patterns by design.
    if (full === SELF) continue;
    if (
      entry.endsWith(".ts") ||
      entry.endsWith(".tsx") ||
      entry.endsWith(".js") ||
      entry.endsWith(".jsx")
    ) {
      yield full;
    }
  }
}

describe("Phase 0 Seam 8 — no i18n imports in ui/tandem/src", () => {
  it("has no react-intl, @/shared/i18n, or useLocaleFormatting references", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_ROOT)) {
      const text = readFileSync(file, "utf-8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) {
          offenders.push(`${relative(SRC_ROOT, file)}: ${pattern}`);
          break;
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
