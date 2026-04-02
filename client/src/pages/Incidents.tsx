import { useIncidents } from "@/hooks/use-incidents";
import { FloorplanMap } from "@/components/FloorplanMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Filter, AlertCircle, CheckCircle, Clock, Download, Map as MapIcon, List, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Incidents() {
  const { incidents, isLoading, updateIncidentStatus } = useIncidents();
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [exportingId, setExportingId] = useState<number | null>(null);

  const downloadPDF = async (id: number) => {
    setExportingId(id);
    try {
      // Simulate real generation delay
      await new Promise(r => setTimeout(r, 1500));
      const res = await fetch(`/api/incidents/${id}/pdf`);
      const data = await res.json();
      toast({
        title: "📄 Report Ready",
        description: `${data.message}. Initializing download for ${data.filename}...`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Communication error with the report server.",
      });
    } finally {
      setExportingId(null);
    }
  };

  const filteredIncidents = incidents?.filter((incident: any) =>
    incident.title.toLowerCase().includes(filter.toLowerCase()) ||
    incident.location.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  const downloadCSV = () => {
    if (!filteredIncidents.length) return;

    const headers = ["ID,Title,Location,Severity,Status,Date"];
    const rows = filteredIncidents.map((inc: any) => {
      const title = inc.title ? inc.title.replace(/"/g, '""') : '';
      const location = inc.location ? inc.location.replace(/"/g, '""') : '';
      return `${inc.id},"${title}","${location}",${inc.severity},${inc.status},${format(new Date(inc.createdAt), 'yyyy-MM-dd HH:mm:ss')}`;
    });

    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `incidents_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Incident Log</h1>
          <p className="text-muted-foreground">Manage and track reported safety incidents</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Reports</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter reports..."
                  className="pl-9 w-[250px]"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={downloadCSV} disabled={filteredIncidents.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <div className="flex justify-end mb-4">
              <TabsList>
                <TabsTrigger value="list" className="flex gap-2"><List className="w-4 h-4" /> List View</TabsTrigger>
                <TabsTrigger value="map" className="flex gap-2"><MapIcon className="w-4 h-4" /> Map View</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="m-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[100px]">Severity</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No incidents found matching your filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIncidents.map((incident: any) => (
                        <TableRow key={incident.id} className="hover:bg-muted/30">
                          <TableCell>
                            <Badge variant={
                              incident.severity === 'critical' ? 'destructive' :
                                incident.severity === 'high' ? 'destructive' :
                                  incident.severity === 'medium' ? 'outline' : 'secondary'
                            } className="uppercase font-bold text-[10px]">
                              {incident.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{incident.title}</TableCell>
                          <TableCell>{incident.location}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(incident.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              incident.status === 'resolved' ? "border-green-500 text-green-600 bg-green-500/10" :
                                incident.status === 'under_review' ? "border-amber-500 text-amber-600 bg-amber-500/10" :
                                  "border-red-500 text-red-600 bg-red-500/10"
                            }>
                              {incident.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {incident.status === 'under_review' && <Clock className="w-3 h-3 mr-1" />}
                              {incident.status === 'open' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {incident.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 flex items-center gap-1 group relative overflow-hidden"
                                onClick={() => downloadPDF(incident.id)}
                                disabled={exportingId === incident.id}
                              >
                                {exportingId === incident.id ? (
                                   <div className="flex items-center gap-1 animate-pulse">
                                     <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                     <span className="text-[10px] uppercase font-black">Syncing...</span>
                                   </div>
                                ) : (
                                  <>
                                    <FileText className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] uppercase font-black">PDF Report</span>
                                  </>
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateIncidentStatus.mutate({ id: incident.id, status: 'open' })}>
                                    Mark as Open
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateIncidentStatus.mutate({ id: incident.id, status: 'under_review' })}>
                                    Mark as Under Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateIncidentStatus.mutate({ id: incident.id, status: 'resolved' })}>
                                    Mark as Resolved
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="map" className="m-0">
              <FloorplanMap incidents={filteredIncidents} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
