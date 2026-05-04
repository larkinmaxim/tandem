import type { SkillsPort } from "@/core/ports/SkillsPort";
import type { ProviderCredentialsPort } from "@/core/ports/ProviderCredentialsPort";
import type { AgentSetupPort } from "@/core/ports/AgentSetupPort";
import type { ModelSetupPort } from "@/core/ports/ModelSetupPort";
import { GooseConnection } from "@/infra/goose/GooseConnection";
import { GooseSkillsAdapter } from "@/infra/goose/GooseSkillsAdapter";
import { GooseProviderCredentialsAdapter } from "@/infra/goose/GooseProviderCredentialsAdapter";
import { GooseAgentSetupAdapter } from "@/infra/goose/GooseAgentSetupAdapter";
import { GooseModelSetupAdapter } from "@/infra/goose/GooseModelSetupAdapter";
import { InMemorySkills } from "@/infra/test/InMemorySkills";
import { InMemoryProviderCredentials } from "@/infra/test/InMemoryProviderCredentials";
import { InMemoryAgentSetup } from "@/infra/test/InMemoryAgentSetup";
import { InMemoryModelSetup } from "@/infra/test/InMemoryModelSetup";
import type { Skill } from "@/core/domain";

export interface BackendContainer {
  readonly skills: SkillsPort;
  readonly providerCredentials: ProviderCredentialsPort;
  readonly agentSetup: AgentSetupPort;
  readonly modelSetup: ModelSetupPort;
  readonly connection: GooseConnection | null;
}

export function buildProductionBackend(): BackendContainer {
  const connection = new GooseConnection();
  return {
    skills: new GooseSkillsAdapter(),
    providerCredentials: new GooseProviderCredentialsAdapter(),
    agentSetup: new GooseAgentSetupAdapter(),
    modelSetup: new GooseModelSetupAdapter(),
    connection,
  };
}

export interface InMemoryBackendOptions {
  skills?: Skill[];
}

export function buildInMemoryBackend(
  options: InMemoryBackendOptions = {},
): BackendContainer {
  return {
    skills: new InMemorySkills(options.skills),
    providerCredentials: new InMemoryProviderCredentials(),
    agentSetup: new InMemoryAgentSetup(),
    modelSetup: new InMemoryModelSetup(),
    connection: null,
  };
}
