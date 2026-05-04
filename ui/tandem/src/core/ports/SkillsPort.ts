import type { Skill, SkillDraft, SkillExport, SkillImportFile } from "../domain";

export interface SkillsPort {
  list(): Promise<Skill[]>;
  create(draft: SkillDraft): Promise<void>;
  update(draft: SkillDraft): Promise<Skill>;
  remove(name: string): Promise<void>;
  exportSkill(name: string): Promise<SkillExport>;
  importSkills(file: SkillImportFile): Promise<Skill[]>;
}
