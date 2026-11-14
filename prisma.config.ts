const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://stridebrain:stridebrain@localhost:5432/stridebrain?schema=public";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
};
