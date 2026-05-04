import { useBackend } from "./install";
import type { SkillsPort } from "@/core/ports/SkillsPort";

export { installBackend, useBackend, resetBackend } from "./install";

export interface Sdk {
  readonly skills: SkillsPort;
}

export const sdk: Sdk = {
  get skills(): SkillsPort {
    return useBackend().skills;
  },
};
