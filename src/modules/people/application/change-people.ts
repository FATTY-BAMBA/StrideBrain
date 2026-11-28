import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { canManagePeople, parsePeopleChange } from "@/modules/people/domain/policy";
import type { PeopleRepositoryPort, PeopleOutcome } from "@/repositories/ports/people";
export class ChangePeople {
  constructor(private readonly repository: PeopleRepositoryPort) {}
  async execute(context: RuntimeContext, value: unknown): Promise<PeopleOutcome> {
    if (!canManagePeople(context)) return { kind: "DENIED" };
    const input = parsePeopleChange(value);
    if (!input) return { kind: "INVALID" };
    return this.repository.change(context, input);
  }
}
