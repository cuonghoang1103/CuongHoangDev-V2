import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasources: {
    db: {
      // Fallback: khi build time chua co env var, dung gia tri placeholder
      // Runtime su dung adapter (Pool) nen gia tri nay khong anh huong
      url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder",
    },
  },
});
