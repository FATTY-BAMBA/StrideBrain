import "server-only";
import { getPrismaClient } from "./prisma";
import {
  GetFirmListSettings,
  ChangeFirmList,
} from "@/modules/firm-lists/application/manage-firm-lists";
import { PrismaFirmListsRepository } from "@/repositories/prisma/prisma-firm-lists-repository";
import { PrismaFirmListsWriteRepository } from "@/repositories/prisma/prisma-firm-lists-write-repository";
export function createFirmListServices() {
  return {
    get: new GetFirmListSettings(new PrismaFirmListsRepository(getPrismaClient())),
    change: new ChangeFirmList(new PrismaFirmListsWriteRepository(getPrismaClient())),
  };
}
