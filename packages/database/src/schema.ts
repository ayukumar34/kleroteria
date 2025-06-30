// Drizzle ORM
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  varchar
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "PARTICIPANT",
  "ADMINISTRATOR"
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: varchar("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  phone: varchar("phone"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  role: userRoleEnum("role").notNull().default("PARTICIPANT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const schema = {
  users: users,
  sessions: sessions,
};