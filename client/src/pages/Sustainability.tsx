import { useQuery } from "@tanstack/react-query";
import { SustainabilityMetric, api } from "@shared/schema";
import { 
  Zap, 
  Leaf, 
  BarChart3, 
  Factory,
  ArrowUpRight,
  Globe
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { motion } from "framer-motion";

export default function Sustainability() {
  const { data: metrics, isLoading } = useQuery<SustainabilityMetric[]>({
    queryKey: [api.sustainability.list.path],
    refetchInterval: 10000 
  });

  const recentMetrics = metrics?.slice(0, 10).reverse().map(m => ({
    ...m,
    consumption: parseFloat(m.consumption),
    carbon: parseFloat(m.carbonFootprint)
  })) || [];
  const areaGroups = metrics?.reduce((acc, m) => {
    if (!acc[m.area]) acc[m.area] = { consumption: 0, carbon: 0, count: 0 };
    acc[m.area].consumption += parseFloat(m.consumption);
    acc[m.area].carbon += parseFloat(m.carbonFootprint);
    acc[m.area].count += 1;
    return acc;
  }, {} as Record<string, { consumption: number, carbon: number, count: number }>);

  const barData = Object.entries(areaGroups || {}).map(([name, data]) => ({
    name,
    consumption: Math.round(data.consumption / data.count)
  }));

  const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Sustainability & Energy</h1>
          <p className="text-muted-foreground">Monitor real-time energy efficiency and carbon footprint</p>
        </div>
        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-500" />
          <span className="text-green-500 font-bold uppercase text-xs tracking-widest">ESG Compliant</span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                 <Zap className="w-5 h-5" />
               </div>
               <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Consumption</p>
            <h3 className="text-2xl font-black">4,285 <span className="text-sm font-medium">kWh</span></h3>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                 <Leaf className="w-5 h-5" />
               </div>
               <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">-12%</div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Carbon Footprint</p>
            <h3 className="text-2xl font-black">1.7 <span className="text-sm font-medium">tons CO2</span></h3>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                 <Globe className="w-5 h-5" />
               </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Active Areas</p>
            <h3 className="text-2xl font-black">{Object.keys(areaGroups || {}).length} <span className="text-sm font-medium">Nodes</span></h3>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
               <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                 <BarChart3 className="w-5 h-5" />
               </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Efficiency Score</p>
            <h3 className="text-2xl font-black">A- <span className="text-sm font-medium">High</span></h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-blue-600/10 border-b border-blue-600/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              Live Power Load
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={recentMetrics}>
                    <defs>
                      <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                    <XAxis 
                       dataKey="createdAt" 
                       hide 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val}kW`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelClassName="hidden"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke="#3B82F6" 
                      fillOpacity={1} 
                      fill="url(#colorCons)" 
                      strokeWidth={3}
                    />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-green-600/10 border-b border-green-600/10">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Factory className="w-4 h-4 text-green-500" />
              Regional Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888822" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="consumption" radius={[0, 4, 4, 0]} barSize={20}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl bg-primary/5 p-6 border border-primary/10 flex items-center gap-6">
        <div className="p-4 bg-primary/20 rounded-full text-primary">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-lg font-black uppercase tracking-tight">AI Savings Recommendation</h4>
          <p className="text-sm text-muted-foreground">Reducing output on <strong>Assembly Line 2</strong> during peak hours (14:00 - 16:00) could lower your carbon footprint by <strong>150kg</strong> per month based on Current Load patterns.</p>
        </div>
      </div>
    </div>
  );
}
