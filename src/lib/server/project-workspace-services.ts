import { getPrismaClient } from "@/lib/server/prisma";
import { createInternalReviewServices } from "@/lib/server/internal-review-services";
import { GetProjectWorkspace } from "@/modules/projects/application/get-project-workspace";
import { ListAuthorizedProjects } from "@/modules/projects/application/list-authorized-projects";
import {
  PrismaProjectListRepository,
  type PrismaProjectListReader,
} from "@/repositories/prisma/prisma-project-list-repository";
import {
  PrismaProjectRepository,
  type PrismaProjectReader,
} from "@/repositories/prisma/prisma-project-repository";
import {
  PrismaProjectWorkspaceRepository,
  type PrismaProjectWorkspaceDatabase,
} from "@/repositories/prisma/prisma-project-workspace-repository";

type ProjectWorkspaceDatabase = PrismaProjectReader & PrismaProjectWorkspaceDatabase;

export function createProjectListService(): ListAuthorizedProjects {
  return new ListAuthorizedProjects(
    new PrismaProjectListRepository(getPrismaClient() as unknown as PrismaProjectListReader),
  );
}

/** Creates the Stage 3 project workspace use case from server-only adapters. */
export function createProjectWorkspaceService(): GetProjectWorkspace {
  const database = getPrismaClient() as unknown as ProjectWorkspaceDatabase;
  return new GetProjectWorkspace(
    new PrismaProjectRepository(database),
    new PrismaProjectWorkspaceRepository(database),
    undefined,
    undefined,
    {
      async list(context, projectKey) {
        const result = await createInternalReviewServices().listProjectActions(
          context,
          projectKey,
          context.locale,
        );
        return result.kind === "AVAILABLE"
          ? result.actions.map((action) => ({
              id: action.businessKey,
              title: action.title,
              status: action.status,
              dueDate: action.dueDate ? new Date(`${action.dueDate}T00:00:00Z`) : null,
            }))
          : [];
      },
    },
  );
}
