import { getPrismaClient } from "@/lib/server/prisma";
import { GetProjectWorkspace } from "@/modules/projects/application/get-project-workspace";
import {
  PrismaProjectRepository,
  type PrismaProjectReader,
} from "@/repositories/prisma/prisma-project-repository";
import {
  PrismaProjectWorkspaceRepository,
  type PrismaProjectWorkspaceDatabase,
} from "@/repositories/prisma/prisma-project-workspace-repository";

type ProjectWorkspaceDatabase = PrismaProjectReader & PrismaProjectWorkspaceDatabase;

/** Creates the Stage 3 project workspace use case from server-only adapters. */
export function createProjectWorkspaceService(): GetProjectWorkspace {
  const database = getPrismaClient() as unknown as ProjectWorkspaceDatabase;
  return new GetProjectWorkspace(
    new PrismaProjectRepository(database),
    new PrismaProjectWorkspaceRepository(database),
  );
}
