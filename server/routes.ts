
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Settings/Preferences endpoints
  // Note: For a strictly anonymous app, these might not even be used if we stick to localStorage,
  // but they are here to fulfill the architectural requirement of a backend.
  
  app.get(api.preferences.get.path, async (req, res) => {
    // Default to ID 1 for this local-first app
    const prefs = await storage.getPreferences(1);
    if (!prefs) {
       // Return defaults if not found
       return res.json({ theme: 'system', defaultZoom: 'auto' });
    }
    res.json(prefs);
  });

  app.post(api.preferences.update.path, async (req, res) => {
    try {
      const input = api.preferences.update.input.parse(req.body);
      const saved = await storage.savePreferences(input);
      res.json(saved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
