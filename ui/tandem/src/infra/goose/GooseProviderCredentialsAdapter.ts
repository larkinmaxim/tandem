import { invoke } from "@tauri-apps/api/core";
import type { ProviderFieldValue, ProviderStatus } from "@/core/domain";
import type { ProviderCredentialsPort } from "@/core/ports/ProviderCredentialsPort";

export class GooseProviderCredentialsAdapter implements ProviderCredentialsPort {
  async getConfig(providerId: string): Promise<ProviderFieldValue[]> {
    return invoke("get_provider_config", { providerId });
  }

  async saveField(key: string, value: string): Promise<void> {
    return invoke("save_provider_field", { key, value });
  }

  async deleteConfig(providerId: string): Promise<void> {
    return invoke("delete_provider_config", { providerId });
  }

  async checkAllStatus(): Promise<ProviderStatus[]> {
    return invoke("check_all_provider_status");
  }

  async restartApp(): Promise<void> {
    return invoke("restart_app");
  }
}
