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
  "FREE",
  "PAID"
]);

export const tokenTypeEnum = pgEnum("token_type", [
  "EMAIL",
  "PHONE",
]);

export const tokenStatusEnum = pgEnum("token_status", [
  "PENDING",
  "EXPIRED",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  phone: varchar("phone").notNull().unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  role: userRoleEnum("role").notNull().default("FREE"),
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

export const tokens = pgTable("tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  type: tokenTypeEnum("type").notNull(),
  status: tokenStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const schema = {
  users: users,
  sessions: sessions,
  tokens: tokens,
};