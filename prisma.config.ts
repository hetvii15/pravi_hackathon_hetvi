import { defineConfig, env } from "prisma/config";

// prisma.config.ts is evaluated before Next.js' own env loading, so load
// the local .env file explicitly for the Prisma CLI (migrate/seed/studio).
try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. in CI where DATABASE_URL is injected directly).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
