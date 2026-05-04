export interface ModelSetupPort {
  authenticate(providerId: string, providerLabel: string): Promise<void>;
  onSetupOutput(
    providerId: string,
    callback: (line: string) => void,
  ): Promise<() => void>;
}
