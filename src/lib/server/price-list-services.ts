import "server-only";
import { getPrismaClient } from "./prisma";
import { ReadPriceList } from "@/modules/price-list/application/read-price-list";
import { PrismaPriceListRepository } from "@/repositories/prisma/prisma-price-list-repository";
export function createPriceListService() {
  return new ReadPriceList(new PrismaPriceListRepository(getPrismaClient()));
}
