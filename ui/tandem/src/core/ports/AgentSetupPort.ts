export interface AgentSetupPort {
  checkInstalled(providerId: string): Promise<boolean>;
  checkAuth(providerId: string): Promise<boolean>;
  install(providerId: string): Promise<void>;
  authenticate(providerId: string): Promise<void>;
  onSetupOutput(
    providerId: string,
    callback: (line: string) => void,
  ): Promise<() => void>;
}
