import type { ChatPort } from "@/core/ports/ChatPort";
import type { SendMessageOptions, PrepareSessionOptions } from "@/core/domain/Chat";

interface PreparedSession {
  gooseSessionId: string;
  providerId: string;
  workingDir: string;
}

export class InMemoryChat implements ChatPort {
  readonly sentMessages: Array<{
    sessionId: string;
    prompt: string;
    options?: SendMessageOptions;
  }> = [];
  readonly cancelledSessions: string[] = [];
  private prepared = new Map<string, PreparedSession>();
  private sessionCounter = 0;

  async prepareSession(
    sessionId: string,
    providerId: string,
    workingDir: string,
    _options?: PrepareSessionOptions,
  ): Promise<void> {
    this.sessionCounter += 1;
    const gooseSessionId = `goose-${this.sessionCounter}`;
    this.prepared.set(sessionId, { gooseSessionId, providerId, workingDir });
  }

  async send(
    sessionId: string,
    prompt: string,
    options?: SendMessageOptions,
  ): Promise<void> {
    this.sentMessages.push({ sessionId, prompt, options });
  }

  async cancel(sessionId: string, _personaId?: string): Promise<boolean> {
    this.cancelledSessions.push(sessionId);
    return true;
  }

  async setModel(_sessionId: string, _modelId: string): Promise<void> {}

  async loadSession(
    sessionId: string,
    gooseSessionId: string,
    workingDir?: string,
  ): Promise<void> {
    this.prepared.set(sessionId, {
      gooseSessionId,
      providerId: "goose",
      workingDir: workingDir ?? "~/.goose/artifacts",
    });
  }

  getGooseSessionId(sessionId: string, _personaId?: string): string | null {
    return this.prepared.get(sessionId)?.gooseSessionId ?? null;
  }
}
