import { getPrismaClient } from "@/lib/server/prisma";
import { CreateProject } from "@/modules/projects/application/create-project";
import { UpdateProjectStage } from "@/modules/projects/application/update-project-stage";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";

export function createProjectWriteServices() {
  const repository = new PrismaProjectWriteRepository(getPrismaClient());
  return { create: new CreateProject(repository), updateStage: new UpdateProjectStage(repository) };
}
