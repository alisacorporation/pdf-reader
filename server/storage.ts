
import { db } from "./db";
import {
  preferences,
  type InsertPreference,
  type Preference
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPreferences(id: number): Promise<Preference | undefined>;
  savePreferences(pref: InsertPreference): Promise<Preference>;
}

export class DatabaseStorage implements IStorage {
  // We'll treat ID 1 as the default/single user for this anonymous local-first app
  async getPreferences(id: number): Promise<Preference | undefined> {
    const [pref] = await db.select().from(preferences).where(eq(preferences.id, id));
    return pref;
  }

  async savePreferences(pref: InsertPreference): Promise<Preference> {
    // Upsert logic for the single preference record
    const existing = await this.getPreferences(1);
    if (existing) {
      const [updated] = await db.update(preferences)
        .set(pref)
        .where(eq(preferences.id, 1))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(preferences)
        .values({ ...pref, id: 1 }) // Force ID 1
        .returning();
      return created;
    }
  }
}

export const storage = new MemStorage();
