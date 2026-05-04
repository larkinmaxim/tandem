import { invoke } from "@tauri-apps/api/core";
import type { Skill, SkillDraft, SkillExport, SkillImportFile } from "@/core/domain";
import type { SkillsPort } from "@/core/ports/SkillsPort";

export class GooseSkillsAdapter implements SkillsPort {
  async list(): Promise<Skill[]> {
    return invoke("list_skills");
  }

  async create(draft: SkillDraft): Promise<void> {
    return invoke("create_skill", {
      name: draft.name,
      description: draft.description,
      instructions: draft.instructions,
    });
  }

  async update(draft: SkillDraft): Promise<Skill> {
    return invoke("update_skill", {
      name: draft.name,
      description: draft.description,
      instructions: draft.instructions,
    });
  }

  async remove(name: string): Promise<void> {
    return invoke("delete_skill", { name });
  }

  async exportSkill(name: string): Promise<SkillExport> {
    return invoke("export_skill", { name });
  }

  async importSkills(file: SkillImportFile): Promise<Skill[]> {
    return invoke("import_skills", {
      fileBytes: Array.from(file.fileBytes),
      fileName: file.fileName,
    });
  }
}
