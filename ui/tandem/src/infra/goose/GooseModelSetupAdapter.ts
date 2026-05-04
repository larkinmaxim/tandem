import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ModelSetupPort } from "@/core/ports/ModelSetupPort";

interface ModelSetupOutput {
  providerId: string;
  line: string;
}

export class GooseModelSetupAdapter implements ModelSetupPort {
  async authenticate(
    providerId: string,
    providerLabel: string,
  ): Promise<void> {
    return invoke("authenticate_model_provider", { providerId, providerLabel });
  }

  async onSetupOutput(
    providerId: string,
    callback: (line: string) => void,
  ): Promise<() => void> {
    return listen<ModelSetupOutput>("model-setup:output", (event) => {
      if (event.payload.providerId === providerId) {
        callback(event.payload.line);
      }
    });
  }
}
