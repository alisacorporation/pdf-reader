import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

// Helper to check if DB is connected
let dbInstance: any = null;

export const getDb = async () => {
  if (dbInstance) return dbInstance;
  
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set. Falling back to mock DB for this session.");
    return null;
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    dbInstance = drizzle(connection, { schema, mode: "default" });
    return dbInstance;
  } catch (err) {
    console.error("Failed to connect to MariaDB:", err);
    return null;
  }
};

// For compatibility with existing imports, though it might be null initially
export const db = null; 
