import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/schema";

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}
