import type { ProviderFieldValue, ProviderStatus } from "@/core/domain";
import type { ProviderCredentialsPort } from "@/core/ports/ProviderCredentialsPort";

export class InMemoryProviderCredentials implements ProviderCredentialsPort {
  private configs = new Map<string, ProviderFieldValue[]>();
  private configured = new Set<string>();

  async getConfig(providerId: string): Promise<ProviderFieldValue[]> {
    return this.configs.get(providerId) ?? [];
  }

  async saveField(key: string, value: string): Promise<void> {
    const providerId = key.split(".")[0];
    this.configured.add(providerId);
    const existing = this.configs.get(providerId) ?? [];
    const idx = existing.findIndex((f) => f.key === key);
    const field: ProviderFieldValue = {
      key,
      value,
      isSet: true,
      isSecret: false,
      required: true,
    };
    if (idx >= 0) {
      existing[idx] = field;
    } else {
      existing.push(field);
    }
    this.configs.set(providerId, existing);
  }

  async deleteConfig(providerId: string): Promise<void> {
    this.configs.delete(providerId);
    this.configured.delete(providerId);
  }

  async checkAllStatus(): Promise<ProviderStatus[]> {
    return Array.from(this.configured).map((providerId) => ({
      providerId,
      isConfigured: true,
    }));
  }

  async restartApp(): Promise<void> {}
}
