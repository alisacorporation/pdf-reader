import { db, getDb } from "./db";
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
  async getPreferences(id: number): Promise<Preference | undefined> {
    const database = await getDb();
    if (!database) return undefined;
    const [pref] = await database.select().from(preferences).where(eq(preferences.id, id));
    return pref;
  }

  async savePreferences(pref: InsertPreference): Promise<Preference> {
    const database = await getDb();
    if (!database) throw new Error("Database not connected");
    
    const existing = await this.getPreferences(1);
    if (existing) {
      const [updated] = await database.update(preferences)
        .set(pref)
        .where(eq(preferences.id, 1))
        .returning();
      return updated;
    } else {
      const [created] = await database.insert(preferences)
        .values({ ...pref, id: 1 })
        .returning();
      return created;
    }
  }
}

export class MemStorage implements IStorage {
  private prefs: Map<number, Preference> = new Map();

  async getPreferences(id: number): Promise<Preference | undefined> {
    return this.prefs.get(id);
  }

  async savePreferences(pref: InsertPreference): Promise<Preference> {
    const id = 1;
    const newPref: Preference = { ...pref, id, createdAt: new Date() };
    this.prefs.set(id, newPref);
    return newPref;
  }
}

export const storage = new MemStorage();
