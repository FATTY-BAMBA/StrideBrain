import { getPrismaClient } from "@/lib/server/prisma";
import { CreateProject } from "@/modules/projects/application/create-project";
import { UpdateProjectStage } from "@/modules/projects/application/update-project-stage";
import { ListProjectClients } from "@/modules/projects/application/list-project-clients";
import { PrismaProjectWriteRepository } from "@/repositories/prisma/prisma-project-write-repository";
import { ProjectSiteAddress } from "@/modules/projects/application/project-site-address";
import { PrismaProjectSiteAddressRepository } from "@/repositories/prisma/prisma-project-site-address-repository";

export function createProjectWriteServices() {
  const repository = new PrismaProjectWriteRepository(getPrismaClient());
  return {
    create: new CreateProject(repository),
    updateStage: new UpdateProjectStage(repository),
    listClients: new ListProjectClients(repository),
    siteAddress: new ProjectSiteAddress(new PrismaProjectSiteAddressRepository(getPrismaClient())),
  };
}
