
import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll keep the backend schema minimal since most logic is client-side for privacy.
// This table is just a placeholder to ensure the stack works correctly, 
// primarily could be used for non-identifiable app preferences if we ever decided to sync them (optional).
export const preferences = pgTable("preferences", {
  id: serial("id").primaryKey(),
  theme: text("theme").default("system"), // 'light', 'dark', 'system'
  defaultZoom: text("default_zoom").default("auto"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPreferencesSchema = createInsertSchema(preferences).omit({ 
  id: true, 
  createdAt: true 
});

export type Preference = typeof preferences.$inferSelect;
export type InsertPreference = z.infer<typeof insertPreferencesSchema>;

// No document content or metadata is stored in the DB to ensure strict privacy.
