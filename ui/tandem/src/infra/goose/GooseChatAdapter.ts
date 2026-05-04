import type { ChatPort } from "@/core/ports/ChatPort";
import type { SendMessageOptions, PrepareSessionOptions } from "@/core/domain/Chat";
import {
  acpSendMessage,
  acpPrepareSession,
  acpCancelSession,
  acpSetModel,
  acpLoadSession,
} from "@/shared/api/acp";
import { getGooseSessionId } from "@/shared/api/acpSessionTracker";

export class GooseChatAdapter implements ChatPort {
  async prepareSession(
    sessionId: string,
    providerId: string,
    workingDir: string,
    options?: PrepareSessionOptions,
  ): Promise<void> {
    await acpPrepareSession(sessionId, providerId, workingDir, options);
  }

  async send(
    sessionId: string,
    prompt: string,
    options?: SendMessageOptions,
  ): Promise<void> {
    await acpSendMessage(sessionId, prompt, options);
  }

  async cancel(sessionId: string, personaId?: string): Promise<boolean> {
    return acpCancelSession(sessionId, personaId);
  }

  async setModel(sessionId: string, modelId: string): Promise<void> {
    await acpSetModel(sessionId, modelId);
  }

  async loadSession(
    sessionId: string,
    gooseSessionId: string,
    workingDir?: string,
  ): Promise<void> {
    await acpLoadSession(sessionId, gooseSessionId, workingDir);
  }

  getGooseSessionId(sessionId: string, personaId?: string): string | null {
    return getGooseSessionId(sessionId, personaId);
  }
}
