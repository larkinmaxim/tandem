import type { ModelSetupPort } from "@/core/ports/ModelSetupPort";

export class InMemoryModelSetup implements ModelSetupPort {
  async authenticate(
    _providerId: string,
    _providerLabel: string,
  ): Promise<void> {}

  async onSetupOutput(
    _providerId: string,
    _callback: (line: string) => void,
  ): Promise<() => void> {
    return () => {};
  }
}
