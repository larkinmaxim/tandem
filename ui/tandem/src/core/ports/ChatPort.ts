import type { SendMessageOptions, PrepareSessionOptions } from "../domain/Chat";

export interface ChatPort {
  prepareSession(
    sessionId: string,
    providerId: string,
    workingDir: string,
    options?: PrepareSessionOptions,
  ): Promise<void>;

  send(
    sessionId: string,
    prompt: string,
    options?: SendMessageOptions,
  ): Promise<void>;

  cancel(sessionId: string, personaId?: string): Promise<boolean>;

  setModel(sessionId: string, modelId: string): Promise<void>;

  loadSession(
    sessionId: string,
    gooseSessionId: string,
    workingDir?: string,
  ): Promise<void>;

  getGooseSessionId(
    sessionId: string,
    personaId?: string,
  ): string | null;
}
