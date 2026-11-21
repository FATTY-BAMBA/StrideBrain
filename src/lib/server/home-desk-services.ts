import { getPrismaClient } from "./prisma";
import { createComparisonServices } from "./comparison-services";
import { GetHomeDesk } from "@/modules/home-desk/application/get-home-desk";
import { PrismaHomeDeskRepository } from "@/repositories/prisma/prisma-home-desk-repository";

export function createHomeDeskService() {
  return new GetHomeDesk(
    new PrismaHomeDeskRepository(getPrismaClient()),
    createComparisonServices().getHomeComparison,
  );
}
