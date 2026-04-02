import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PPEItem, api } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  HardHat, 
  Search, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCcw,
  Info
} from "lucide-react";
import { format, isAfter, addDays } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function PPEInventory() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ppeItems, isLoading } = useQuery<PPEItem[]>({
    queryKey: [api.ppe.list.path],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`/api/ppe/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.ppe.list.path] });
      toast({ 
        title: "✅ Protocol Verified", 
        description: `Successfully updated ${data.name} status to ${data.status.replace('_', ' ')}. Compliance record updated.` 
      });
    }
  });

  const filteredItems = ppeItems?.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-8">Loading inventory...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <HardHat className="w-8 h-8 text-primary" />
            Safety Gear Inventory
          </h1>
          <p className="text-muted-foreground">Monitoring the lifecycle and compliance of all personal protective equipment.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search serial or name..." 
            className="pl-10 rounded-full bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 border-r border-border/50 pr-6 space-y-6 hidden lg:block">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Compliance Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 leading-relaxed">
               <p>All safety gear must be inspected every <span className="font-bold">180 days</span>. Gear marked <span className="text-red-500 font-bold uppercase">Expired</span> must be decommissioned immediately.</p>
               <div className="p-3 bg-background/50 rounded-lg space-y-2">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   <span className="font-bold">OK</span> - Ready for use
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   <span className="font-bold">Maint. Due</span> - Service within 7 days
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredItems?.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="group hover:ring-2 hover:ring-primary/20 transition-all shadow-lg overflow-hidden border-none bg-background/50 backdrop-blur-sm">
                <CardHeader className={`pb-2 ${
                  item.status === 'expired' ? 'bg-red-500/10' : 
                  item.status === 'maintenance_due' ? 'bg-amber-500/10' : 
                  'bg-green-500/10'
                }`}>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className={`uppercase text-[10px] tracking-widest font-black border-2 ${
                      item.status === 'expired' ? 'border-red-500 text-red-500' : 
                      item.status === 'maintenance_due' ? 'border-amber-500 text-amber-500' : 
                      'border-green-500 text-green-500'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">#{item.serialNumber}</span>
                  </div>
                  <CardTitle className="text-xl font-bold mt-2 group-hover:text-primary transition-colors">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Last Inspected
                      </p>
                      <p className="text-xs font-bold">{format(new Date(item.lastInspectionDate), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                         <AlertTriangle className="w-3 h-3" /> Next Due
                      </p>
                      <p className={`text-xs font-bold ${
                        item.status === 'maintenance_due' ? 'text-amber-500' : ''
                      }`}>
                        {format(new Date(item.nextInspectionDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary">
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase tracking-wider">{item.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => updateStatus.mutate({ 
                          id: item.id, 
                          status: item.status === 'ok' ? 'maintenance_due' : 'ok' 
                        })}
                      >
                         <RefreshCcw className={`w-4 h-4 ${updateStatus.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-[10px] font-black uppercase rounded-full">
                        <Info className="w-3 h-3 mr-1" /> Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
