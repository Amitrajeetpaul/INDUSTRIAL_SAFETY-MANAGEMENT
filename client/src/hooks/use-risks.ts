import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertRisk } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRisks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: risks, isLoading } = useQuery({
    queryKey: [api.risks.list.path],
    queryFn: async () => {
      const res = await fetch(api.risks.list.path);
      if (!res.ok) throw new Error("Failed to fetch risks");
      return await res.json();
    },
  });

  const createRisk = useMutation({
    mutationFn: async (data: InsertRisk) => {
      const res = await fetch(api.risks.create.path, {
        method: api.risks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log risk");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.risks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Risk Logged", description: "Hazard has been recorded for assessment." });
    },
  });

  return {
    risks,
    isLoading,
    createRisk,
  };
}
