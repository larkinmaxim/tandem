import { useBackend } from "./install";
import type { SkillsPort } from "@/core/ports/SkillsPort";
import type { ProviderCredentialsPort } from "@/core/ports/ProviderCredentialsPort";
import type { AgentSetupPort } from "@/core/ports/AgentSetupPort";
import type { ModelSetupPort } from "@/core/ports/ModelSetupPort";
import type { ChatPort } from "@/core/ports/ChatPort";
import type { ConnectionPort } from "@/core/ports/ConnectionPort";
import type { SessionEventsPort } from "@/core/ports/SessionEventsPort";

export { installBackend, useBackend, resetBackend } from "./install";

export interface ProvidersFacade {
  readonly credentials: ProviderCredentialsPort;
  readonly agentSetup: AgentSetupPort;
  readonly modelSetup: ModelSetupPort;
}

export interface Sdk {
  readonly skills: SkillsPort;
  readonly providers: ProvidersFacade;
  readonly chat: ChatPort;
  readonly connection: ConnectionPort;
  readonly events: SessionEventsPort;
}

export const sdk: Sdk = {
  get skills(): SkillsPort {
    return useBackend().skills;
  },
  get providers(): ProvidersFacade {
    const backend = useBackend();
    return {
      get credentials() {
        return backend.providerCredentials;
      },
      get agentSetup() {
        return backend.agentSetup;
      },
      get modelSetup() {
        return backend.modelSetup;
      },
    };
  },
  get chat(): ChatPort {
    return useBackend().chat;
  },
  get connection(): ConnectionPort {
    return useBackend().connection;
  },
  get events(): SessionEventsPort {
    return useBackend().events;
  },
};
