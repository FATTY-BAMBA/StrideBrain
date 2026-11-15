import { getPrismaClient } from "@/lib/server/prisma";
import { traceInternalReviewAttempt } from "@/lib/server/internal-review-trace";
import { InternalReviewService } from "@/modules/internal-review/application/internal-review-service";
import {
  PrismaInternalReviewRepository,
  type InternalReviewRepositoryOptions,
} from "@/repositories/prisma/prisma-internal-review-repository";

export type InternalReviewServiceOptions = InternalReviewRepositoryOptions &
  Readonly<{ clock?: (() => Date) | undefined }>;

/** Only this server composition root connects the use case to persistence. */
export function createInternalReviewServices(
  options: InternalReviewServiceOptions = {},
): InternalReviewService {
  return new InternalReviewService(
    new PrismaInternalReviewRepository(getPrismaClient(), options),
    options.clock,
    traceInternalReviewAttempt,
  );
}
