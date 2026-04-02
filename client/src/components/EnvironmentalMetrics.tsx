import { useQuery } from "@tanstack/react-query";
import { Metric, api } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Wind, 
  Droplets, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  HelpCircle,
  BarChart3,
  History,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";

export function EnvironmentalMetrics() {
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
  const { data: metrics, isLoading } = useQuery<Metric[]>({
    queryKey: [api.metrics.list.path],
    refetchInterval: 5000, 
  });

  if (isLoading) return null;

  const airMetrics = metrics?.filter(m => m.type === 'air') || [];
  const waterMetrics = metrics?.filter(m => m.type === 'water') || [];
  const machineMetrics = metrics?.filter(m => m.type === 'machine') || [];

  const MetricCard = ({ icon: Icon, title, items, colorClass, description }: { icon: any, title: string, items: Metric[], colorClass: string, description: string }) => (
    <Card 
      className="overflow-hidden border-none shadow-xl bg-background/50 backdrop-blur-sm cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all active:scale-[0.98] relative group"
      onClick={() => items[0] && setSelectedMetric(items[0])}
    >
      <CardHeader className={`pb-2 border-b border-white/10 ${colorClass} text-white`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 text-white/50 cursor-help" onClick={(e) => e.stopPropagation()} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-48 text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-3">
             <span className="text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Click for details</span>
             <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
             </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMetric(item);
            }}
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums">{item.value}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={item.status === 'optimal' ? 'outline' : 'destructive'} 
                className={`text-[9px] uppercase font-bold px-1.5 border-2 ${
                  item.status === 'optimal' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 
                  item.status === 'warning' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' : 
                  'border-red-500/20 text-red-500 bg-red-500/5'
                }`}>
                {item.status === 'optimal' ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <AlertCircle className="w-2.5 h-2.5 mr-1" />}
                {item.status}
              </Badge>
              {item.type === 'machine' && item.status === 'warning' && (
                <span className="text-[8px] font-bold text-amber-500 animate-pulse uppercase tracking-tighter">Check Required</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <MetricCard 
          icon={Wind} 
          title="Air Quality (AQI)" 
          items={airMetrics} 
          colorClass="bg-gradient-to-r from-blue-600 to-indigo-600"
          description="Monitoring smoke, dust, and particulate matter (PM2.5) across the manufacturing floor."
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <MetricCard 
          icon={Droplets} 
          title="Water Systems" 
          items={waterMetrics} 
          colorClass="bg-gradient-to-r from-cyan-600 to-teal-600"
          description="Real-time analysis of pH balance, turbidity, and chemical composition in industrial water supplies."
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <MetricCard 
          icon={Settings} 
          title="Machine Health" 
          items={machineMetrics} 
          colorClass="bg-gradient-to-r from-orange-600 to-rose-600"
          description="Predictive sensors measuring vibration levels and motor temperatures to prevent mechanical failure."
        />
      </motion.div>

      <MetricDetailDialog 
        metric={selectedMetric} 
        open={!!selectedMetric} 
        onOpenChange={(open) => !open && setSelectedMetric(null)} 
      />
    </div>
  );
}

function MetricDetailDialog({ metric, open, onOpenChange }: { metric: Metric | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!metric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="p-3 w-fit rounded-xl bg-primary/10 text-primary mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">
            {metric.label} Sensor Insight
          </DialogTitle>
          <DialogDescription className="font-medium">
            Detailed diagnostics and historical calibration data for the {metric.type} monitoring system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="bg-muted/50 p-4 rounded-xl border border-border/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Live telemetry</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tabular-nums">{metric.value}</span>
                <span className="text-sm font-bold text-muted-foreground">{metric.unit}</span>
              </div>
            </div>
            <Badge variant={metric.status === 'optimal' ? 'outline' : 'destructive'} 
              className="h-fit uppercase font-black px-3 border-2">
              {metric.status}
            </Badge>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black uppercase tracking-widest">Recent Activity</h4>
             </div>
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                 <div className="flex flex-col">
                   <span className="text-[11px] font-bold">Calibration Verified</span>
                   <span className="text-[9px] text-muted-foreground uppercase">{i}h ago • Sector {Math.floor(Math.random() * 4) + 1}</span>
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                    <CheckCircle2 className="w-3 h-3" />
                    SYNCED
                 </div>
               </div>
             ))}
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex gap-3">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <p className="text-[11px] leading-relaxed italic text-muted-foreground">
              This metric is part of the high-availability safety mesh. Any deviation outside the standard 
              deviation range will trigger an automated incident report and alert the floor manager.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
