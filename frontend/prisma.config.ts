import { defineConfig } from "@prisma/config";

const dbUrl = process.env.DATABASE_URL ?? "postgresql://neondb_owner:npg_USR9OZuE8bzD@ep-aged-shape-aqex55v8.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbUrl,
  },
});
