import type { AssistantModelPort, ModelReply } from "@/modules/assistant/domain/contracts";
/** Scripted test double, never imported by a production composition root. */
export class FakeAssistantModel implements AssistantModelPort {
  readonly requests: Parameters<AssistantModelPort["generate"]>[0][] = [];
  constructor(
    private readonly script: readonly (
      ModelReply | ((request: Parameters<AssistantModelPort["generate"]>[0]) => ModelReply)
    )[],
  ) {}
  async generate(request: Parameters<AssistantModelPort["generate"]>[0]) {
    this.requests.push(request);
    const step = this.script[this.requests.length - 1];
    if (!step) throw new Error("FAKE_SCRIPT_EXHAUSTED");
    const reply = typeof step === "function" ? step(request) : step;
    return reply;
  }
}
