import type { AgentSetupPort } from "@/core/ports/AgentSetupPort";

export class InMemoryAgentSetup implements AgentSetupPort {
  private installed = new Set<string>();
  private authenticated = new Set<string>();

  markInstalled(providerId: string): void {
    this.installed.add(providerId);
  }

  markAuthenticated(providerId: string): void {
    this.authenticated.add(providerId);
  }

  async checkInstalled(providerId: string): Promise<boolean> {
    return this.installed.has(providerId);
  }

  async checkAuth(providerId: string): Promise<boolean> {
    return this.authenticated.has(providerId);
  }

  async install(providerId: string): Promise<void> {
    this.installed.add(providerId);
  }

  async authenticate(providerId: string): Promise<void> {
    this.authenticated.add(providerId);
  }

  async onSetupOutput(
    _providerId: string,
    _callback: (line: string) => void,
  ): Promise<() => void> {
    return () => {};
  }
}
