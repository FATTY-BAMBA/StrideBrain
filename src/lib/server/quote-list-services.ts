import "server-only";
import { getPrismaClient } from "./prisma";
import { ListQuotes } from "@/modules/quotes/application/list-quotes";
import { PrismaQuoteListRepository } from "@/repositories/prisma/prisma-quote-list-repository";
export const createQuoteListService = () =>
  new ListQuotes(new PrismaQuoteListRepository(getPrismaClient()));
