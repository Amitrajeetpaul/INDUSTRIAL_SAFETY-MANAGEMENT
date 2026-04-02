import { useStats } from "@/hooks/use-stats";
import { useIncidents } from "@/hooks/use-incidents";
import { StatsCard } from "@/components/StatsCard";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  FileText, 
  MapPin, 
  Clock 
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { EnvironmentalMetrics } from "@/components/EnvironmentalMetrics";
import { FloorplanMap } from "@/components/FloorplanMap";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { incidents, isLoading: incidentsLoading } = useIncidents();

  // Get recent 3 incidents
  const recentIncidents = incidents?.slice(0, 3) || [];

  const pieData = [
    { name: "Resolved", value: stats?.resolvedCount || 0 },
    { name: "Active", value: stats?.activeCases || 0 },
  ];
  const COLORS = ["#10B981", "#EF4444"];

  if (statsLoading || incidentsLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Overview Dashboard</h1>
          <p className="text-muted-foreground">Real-time safety metrics and incident tracking</p>
        </div>
        <div className="flex gap-2">
           <Link href="/report">
             <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
               <AlertTriangle className="mr-2 h-4 w-4" /> Report Incident
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Incidents" 
          value={stats?.totalIncidents || 0} 
          icon={FileText} 
        />
        <StatsCard 
          title="Active Cases" 
          value={stats?.activeCases || 0} 
          icon={AlertTriangle} 
          color="destructive"
          trend="+2 this week"
        />
        <StatsCard 
          title="Risk Score" 
          value={`${stats?.riskScore || 0}%`} 
          icon={Activity} 
          color={(stats?.riskScore || 0) > 50 ? "warning" : "default"}
        />
        <StatsCard 
          title="Resolved" 
          value={stats?.resolvedCount || 0} 
          icon={CheckCircle2} 
          color="primary"
        />
      </div>

      <EnvironmentalMetrics />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="uppercase flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Interactive Floorplan & Emergency Drill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FloorplanMap incidents={incidents || []} />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-wide">Recent Incidents</h2>
            <Link href="/incidents" className="text-primary text-sm hover:underline font-semibold">View All</Link>
          </div>
          
          <div className="space-y-4">
            {recentIncidents.length === 0 ? (
              <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed">
                <CheckCircle2 className="w-12 h-12 mb-4 text-green-500/50" />
                <p>No incidents reported recently. Good job!</p>
              </Card>
            ) : (
              recentIncidents.map((incident: any) => (
                <Card key={incident.id} className="group hover:border-primary/50 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            incident.severity === 'critical' ? 'destructive' :
                            incident.severity === 'high' ? 'destructive' : 
                            'secondary'
                          } className="uppercase text-[10px] tracking-wider">
                            {incident.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(incident.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{incident.title}</h3>
                        <p className="text-muted-foreground line-clamp-2">{incident.description}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <MapPin className="w-3 h-3" />
                          {incident.location}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        incident.status === 'resolved' ? "border-green-500 text-green-600" :
                        incident.status === 'under_review' ? "border-amber-500 text-amber-600" :
                        "border-red-500 text-red-600"
                      }>
                        {incident.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>

        {/* Analytics Chart */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="uppercase">Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-3xl font-bold block">{stats?.resolvedCount}</span>
                    <span className="text-xs text-muted-foreground uppercase">Resolved</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   <span className="text-sm font-medium">Resolved</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <span className="text-sm font-medium">Active</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
