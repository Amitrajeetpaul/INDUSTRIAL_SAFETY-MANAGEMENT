import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertIncident } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useIncidents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incidents, isLoading } = useQuery({
    queryKey: [api.incidents.list.path],
    queryFn: async () => {
      const res = await fetch(api.incidents.list.path);
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return await res.json();
    },
  });

  const createIncident = useMutation({
    mutationFn: async (data: InsertIncident) => {
      const res = await fetch(api.incidents.create.path, {
        method: api.incidents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.incidents.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Incident Reported", description: "The safety team has been notified." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not report incident.", variant: "destructive" });
    },
  });

  const updateIncidentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "open" | "under_review" | "resolved" }) => {
      const url = buildUrl(api.incidents.update.path, { id });
      const res = await fetch(url, {
        method: api.incidents.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.incidents.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Status Updated", description: "Incident status has been changed." });
    },
  });

  return {
    incidents,
    isLoading,
    createIncident,
    updateIncidentStatus,
  };
}
