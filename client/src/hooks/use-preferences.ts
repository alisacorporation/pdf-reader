import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertPreference } from "@shared/routes";

// Using the server to store minimal non-identifiable preferences
// This is strictly for syncing UI state like theme, NOT document data

export function usePreferences() {
  const query = useQuery({
    queryKey: [api.preferences.get.path],
    queryFn: async () => {
      const res = await fetch(api.preferences.get.path);
      if (res.status === 404) return null; // No preferences set yet
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return api.preferences.get.responses[200].parse(await res.json());
    },
    // We can rely on defaults if this fails or returns 404
    retry: false,
  });
  
  return query;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prefs: InsertPreference) => {
      const res = await fetch(api.preferences.update.path, {
        method: api.preferences.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      
      if (!res.ok) throw new Error("Failed to update preferences");
      return api.preferences.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Optimistically update or invalidate
      queryClient.setQueryData([api.preferences.get.path], data);
    },
  });
}
