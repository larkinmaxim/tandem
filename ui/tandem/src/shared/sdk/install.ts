import type { BackendContainer } from "@/composition/buildBackend";

let installed: BackendContainer | null = null;

export function installBackend(container: BackendContainer): void {
  installed = container;
}

export function useBackend(): BackendContainer {
  if (!installed) {
    throw new Error(
      "Backend not installed. Call installBackend() before using useBackend().",
    );
  }
  return installed;
}

export function resetBackend(): void {
  installed = null;
}
