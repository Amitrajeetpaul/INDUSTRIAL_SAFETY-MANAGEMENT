import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: any;
  trend?: string;
  color?: "default" | "primary" | "destructive" | "warning";
}

export function StatsCard({ title, value, icon: Icon, trend, color = "default" }: StatsCardProps) {
  const colorClasses = {
    default: "text-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
    warning: "text-amber-500",
  };

  const bgClasses = {
    default: "bg-muted/50",
    primary: "bg-primary/10 border-primary/20",
    destructive: "bg-destructive/10 border-destructive/20",
    warning: "bg-amber-500/10 border-amber-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("border shadow-sm hover:shadow-md transition-all duration-300", bgClasses[color])}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={cn("h-4 w-4", colorClasses[color])} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display">{value}</div>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
