import type { SkillsPort } from "@/core/ports/SkillsPort";
import { GooseConnection } from "@/infra/goose/GooseConnection";
import { GooseSkillsAdapter } from "@/infra/goose/GooseSkillsAdapter";
import { InMemorySkills } from "@/infra/test/InMemorySkills";
import type { Skill } from "@/core/domain";

export interface BackendContainer {
  readonly skills: SkillsPort;
  readonly connection: GooseConnection | null;
}

export function buildProductionBackend(): BackendContainer {
  const connection = new GooseConnection();
  return {
    skills: new GooseSkillsAdapter(),
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
    connection: null,
  };
}
