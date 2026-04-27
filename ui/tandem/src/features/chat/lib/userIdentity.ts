// v1.0 placeholder. Real OS-username resolution lands when a Tauri command
// for it is wired (deferred — see issue #17 follow-ups).
export const DEFAULT_USER_NAME = "Maxim";

export function getUserInitials(name: string = DEFAULT_USER_NAME): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
