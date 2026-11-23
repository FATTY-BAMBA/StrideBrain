import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import type {
  AssistantControlOutcome,
  AssistantRepositoryPort,
} from "@/repositories/ports/assistant-repository";
import { record } from "../domain/grounding";
export class SetAssistantControl {
  constructor(private readonly repository: AssistantRepositoryPort) {}
  async execute(context: RuntimeContext, raw: unknown): Promise<AssistantControlOutcome> {
    const input = record(raw);
    if (
      !input ||
      Object.keys(input).some(
        (k) => !["target", "projectKey", "enabled", "idempotencyKey"].includes(k),
      ) ||
      !["ORGANIZATION", "PROJECT"].includes(String(input.target)) ||
      typeof input.enabled !== "boolean" ||
      typeof input.idempotencyKey !== "string" ||
      !/^[a-zA-Z0-9_-]{16,100}$/.test(input.idempotencyKey)
    )
      return { kind: "INVALID" };
    if (input.target === "ORGANIZATION") {
      if (input.projectKey !== undefined) return { kind: "INVALID" };
      if (!context.capabilities.has("settings:manage")) return { kind: "UNAVAILABLE" };
      return this.repository.setControl(context, {
        target: "ORGANIZATION",
        enabled: input.enabled,
        idempotencyKey: input.idempotencyKey,
      });
    }
    if (
      typeof input.projectKey !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(input.projectKey)
    )
      return { kind: "INVALID" };
    if (!context.capabilities.has("project:update") || !context.capabilities.has("project:read"))
      return { kind: "UNAVAILABLE" };
    return this.repository.setControl(context, {
      target: "PROJECT",
      projectKey: input.projectKey,
      enabled: input.enabled,
      idempotencyKey: input.idempotencyKey,
    });
  }
}
