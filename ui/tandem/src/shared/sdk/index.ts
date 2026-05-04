import { useBackend } from "./install";
import type { SkillsPort } from "@/core/ports/SkillsPort";
import type { ProviderCredentialsPort } from "@/core/ports/ProviderCredentialsPort";
import type { AgentSetupPort } from "@/core/ports/AgentSetupPort";
import type { ModelSetupPort } from "@/core/ports/ModelSetupPort";

export { installBackend, useBackend, resetBackend } from "./install";

export interface ProvidersFacade {
  readonly credentials: ProviderCredentialsPort;
  readonly agentSetup: AgentSetupPort;
  readonly modelSetup: ModelSetupPort;
}

export interface Sdk {
  readonly skills: SkillsPort;
  readonly providers: ProvidersFacade;
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
};
