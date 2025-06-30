// Drizzle ORM
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.SUPABASE_CONNECTION_STRING

if (!connectionString) {
  throw new Error("SUPABASE_CONNECTION_STRING is not set in the environment variables");
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/_out",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});