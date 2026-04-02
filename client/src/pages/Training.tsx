import { useQuery } from "@tanstack/react-query";
import { TrainingCertification, api } from "@shared/schema";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search,
  School,
  Calendar,
  User as UserIcon
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Training() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: certs, isLoading } = useQuery<TrainingCertification[]>({
    queryKey: [api.training.list.path]
  });

  const filteredCerts = certs?.filter(c => 
    c.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'valid':
        return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Valid" };
      case 'expiring_soon':
        return { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Expiring Soon" };
      case 'expired':
        return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Expired" };
      default:
        return { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted/10", label: status };
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Safety Training & Compliance</h1>
        <p className="text-muted-foreground">Monitor worker certifications and regulatory compliance</p>
      </div>

      <div className="flex items-center gap-4 bg-background/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search worker or course..." 
          className="max-w-md border-none bg-transparent focus-visible:ring-0 text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg text-primary">
                <School className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase">Compliance Rate</p>
                <h3 className="text-2xl font-black">94.2%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-lg text-amber-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase">Expiring Soon</p>
                <h3 className="text-2xl font-black">{certs?.filter(c => c.status === 'expiring_soon').length || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase">Currently Expired</p>
                <h3 className="text-2xl font-black">{certs?.filter(c => c.status === 'expired').length || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <p>Loading compliance data...</p>
        ) : filteredCerts?.length === 0 ? (
          <div className="p-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
            <p className="text-muted-foreground font-bold">No certification records found.</p>
          </div>
        ) : (
          filteredCerts?.map((cert, index) => {
            const config = getStatusConfig(cert.status);
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden border-none shadow-lg bg-background/40 backdrop-blur-md">
                  <div className="h-full w-1 absolute left-0 top-0 bg-primary group-hover:w-2 transition-all" />
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-secondary-foreground border border-border">
                          <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black tracking-tight">{cert.workerName}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                            <School className="w-4 h-4" />
                            {cert.courseName}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-8">
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Issue Date</p>
                          <div className="flex items-center gap-2 font-bold">
                            <Calendar className="w-4 h-4 text-primary" />
                            {format(new Date(cert.issueDate), 'MMM d, yyyy')}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Expiry Date</p>
                          <div className="flex items-center gap-2 font-bold">
                            <Clock className="w-4 h-4 text-destructive" />
                            {format(new Date(cert.expiryDate), 'MMM d, yyyy')}
                          </div>
                        </div>

                        <Badge className={`${config.bg} ${config.color} border-none font-black uppercase tracking-tighter px-4 py-1 flex items-center gap-2 hover:bg-${config.bg}`}>
                          <config.icon className="w-4 h-4" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
