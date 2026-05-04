import type { Skill, SkillDraft, SkillExport, SkillImportFile } from "@/core/domain";
import type { SkillsPort } from "@/core/ports/SkillsPort";

export class InMemorySkills implements SkillsPort {
  private skills: Skill[] = [];

  constructor(initial: Skill[] = []) {
    this.skills = [...initial];
  }

  async list(): Promise<Skill[]> {
    return [...this.skills];
  }

  async create(draft: SkillDraft): Promise<void> {
    this.skills.push({
      name: draft.name,
      description: draft.description,
      instructions: draft.instructions,
      path: `/skills/${draft.name}`,
    });
  }

  async update(draft: SkillDraft): Promise<Skill> {
    const idx = this.skills.findIndex((s) => s.name === draft.name);
    if (idx === -1) throw new Error(`Skill not found: ${draft.name}`);
    const updated: Skill = {
      ...this.skills[idx],
      description: draft.description,
      instructions: draft.instructions,
    };
    this.skills[idx] = updated;
    return updated;
  }

  async remove(name: string): Promise<void> {
    this.skills = this.skills.filter((s) => s.name !== name);
  }

  async exportSkill(name: string): Promise<SkillExport> {
    const skill = this.skills.find((s) => s.name === name);
    if (!skill) throw new Error(`Skill not found: ${name}`);
    return {
      json: JSON.stringify(skill),
      filename: `${name}.skill.json`,
    };
  }

  async importSkills(file: SkillImportFile): Promise<Skill[]> {
    const text = new TextDecoder().decode(new Uint8Array(file.fileBytes));
    const imported = JSON.parse(text) as Skill | Skill[];
    const arr = Array.isArray(imported) ? imported : [imported];
    this.skills.push(...arr);
    return arr;
  }
}
