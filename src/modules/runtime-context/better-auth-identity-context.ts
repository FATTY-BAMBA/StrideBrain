import type { IdentityContextPort, RuntimeContext } from "./contracts";
import type {
  RealIdentityRepositoryPort,
  VerifiedSession,
} from "@/repositories/ports/real-identity";
export interface VerifiedSessionPort {
  read(headers: Headers): Promise<VerifiedSession | null>;
}
export class BetterAuthIdentityContext implements IdentityContextPort {
  constructor(
    private readonly sessions: VerifiedSessionPort,
    private readonly repository: RealIdentityRepositoryPort,
    private readonly now = () => new Date(),
  ) {}
  async resolve(request: Request): Promise<RuntimeContext | null> {
    const session = await this.sessions.read(request.headers);
    if (
      !session?.emailVerified ||
      session.expiresAt <= this.now() ||
      session.createdAt.getTime() + 30 * 86400_000 <= this.now().getTime()
    )
      return null;
    return this.repository.resolve(session);
  }
}
