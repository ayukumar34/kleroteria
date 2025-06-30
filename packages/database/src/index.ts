// Environment
import dotenv from "dotenv";
dotenv.config();

// Drizzle ORM
import { drizzle } from "drizzle-orm/postgres-js";

// PostgreSQL
import postgres from "postgres";

// Schema
import {
  users,
  sessions,
} from "./schema";

const connectionString = process.env.SUPABASE_CONNECTION_STRING

if (!connectionString) {
  throw new Error("SUPABASE_CONNECTION_STRING is not set in the environment variables");
}

// Create client
const client = postgres(connectionString, { prepare: false });

// Export schema
export const schema = {
  users,
  sessions,
};

// Export types
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

// Create database
export const db = drizzle(client, { schema });