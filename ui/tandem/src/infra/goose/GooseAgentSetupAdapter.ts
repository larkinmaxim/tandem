import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { AgentSetupPort } from "@/core/ports/AgentSetupPort";

interface AgentSetupOutput {
  providerId: string;
  line: string;
}

export class GooseAgentSetupAdapter implements AgentSetupPort {
  async checkInstalled(providerId: string): Promise<boolean> {
    return invoke("check_agent_installed", { providerId });
  }

  async checkAuth(providerId: string): Promise<boolean> {
    return invoke("check_agent_auth", { providerId });
  }

  async install(providerId: string): Promise<void> {
    return invoke("install_agent", { providerId });
  }

  async authenticate(providerId: string): Promise<void> {
    return invoke("authenticate_agent", { providerId });
  }

  async onSetupOutput(
    providerId: string,
    callback: (line: string) => void,
  ): Promise<() => void> {
    return listen<AgentSetupOutput>("agent-setup:output", (event) => {
      if (event.payload.providerId === providerId) {
        callback(event.payload.line);
      }
    });
  }
}
