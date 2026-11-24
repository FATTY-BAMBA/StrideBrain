import "server-only";
import { GetClientJobs } from "@/modules/clients/application/get-client-jobs";
import { PrismaClientJobsRepository } from "@/repositories/prisma/prisma-client-jobs-repository";
import { getPrismaClient } from "./prisma";
import {
  GetClient,
  ListClients,
  UpdateClient,
} from "@/modules/clients/application/client-services";
import { PrismaClientRepository } from "@/repositories/prisma/prisma-client-repository";

export function createClientServices() {
  const clients = new PrismaClientRepository(getPrismaClient());
  return {
    list: new ListClients(clients),
    jobs: new GetClientJobs(new PrismaClientJobsRepository(getPrismaClient())),
    get: new GetClient(clients),
    update: new UpdateClient(clients),
  };
}
