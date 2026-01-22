import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { mysqlTable, varchar, serial as mysqlSerial, timestamp as mysqlTimestamp, text as mysqlText } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Drizzle supports both, but we will define the MySQL/MariaDB version
export const preferences = mysqlTable("preferences", {
  id: mysqlSerial("id").primaryKey(),
  theme: mysqlText("theme"), // 'light', 'dark', 'system'
  defaultZoom: mysqlText("default_zoom"),
  createdAt: mysqlTimestamp("created_at").defaultNow(),
});

export const insertPreferencesSchema = createInsertSchema(preferences).omit({ 
  id: true, 
  createdAt: true 
});

export type Preference = typeof preferences.$inferSelect;
export type InsertPreference = z.infer<typeof insertPreferencesSchema>;
