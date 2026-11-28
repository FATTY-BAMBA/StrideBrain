import type { RuntimeContext } from "@/modules/runtime-context/contracts";
export type VerifiedSession = {
  id: string;
  userId: string;
  emailVerified: boolean;
  expiresAt: Date;
  createdAt: Date;
};
export interface RealIdentityRepositoryPort {
  resolve(session: VerifiedSession): Promise<RuntimeContext | null>;
}
