export interface Skill {
  readonly name: string;
  readonly description: string;
  readonly instructions: string;
  readonly path: string;
}

export interface SkillDraft {
  readonly name: string;
  readonly description: string;
  readonly instructions: string;
}

export interface SkillExport {
  readonly json: string;
  readonly filename: string;
}

export interface SkillImportFile {
  readonly fileBytes: number[];
  readonly fileName: string;
}
