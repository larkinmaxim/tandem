import type { ProviderFieldValue, ProviderStatus } from "../domain/Provider";

export interface ProviderCredentialsPort {
  getConfig(providerId: string): Promise<ProviderFieldValue[]>;
  saveField(key: string, value: string): Promise<void>;
  deleteConfig(providerId: string): Promise<void>;
  checkAllStatus(): Promise<ProviderStatus[]>;
  restartApp(): Promise<void>;
}
