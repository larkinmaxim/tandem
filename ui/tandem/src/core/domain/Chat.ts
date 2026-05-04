export interface SendMessageOptions {
  systemPrompt?: string;
  personaId?: string;
  personaName?: string;
  images?: [string, string][];
}

export interface PrepareSessionOptions {
  personaId?: string;
}

export interface SessionInfo {
  sessionId: string;
  title: string | null;
  updatedAt: string | null;
  messageCount: number;
}
