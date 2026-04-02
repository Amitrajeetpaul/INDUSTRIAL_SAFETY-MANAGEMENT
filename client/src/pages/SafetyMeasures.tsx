import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafetyMeasure, api, insertSafetyMeasureSchema } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ShieldCheck, Zap, Plus, Info } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function SafetyMeasures() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const { data: measures, isLoading } = useQuery<SafetyMeasure[]>({
    queryKey: [api.safetyMeasures.list.path],
  });

  const createMeasure = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.safetyMeasures.create.path, {
        method: api.safetyMeasures.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Creation failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.safetyMeasures.list.path] });
      toast({ title: "Measure Recorded", description: "The new safety improvement has been documented." });
      setOpen(false);
      form.reset();
    }
  });

  const form = useForm({
    resolver: zodResolver(insertSafetyMeasureSchema),
    defaultValues: {
      description: "",
      actionTaken: "",
      status: "in_progress",
    }
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading safety improvements...</div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Safety Improvements
          </h1>
          <p className="text-muted-foreground">Historical and active measures taken to enhance facility safety.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold uppercase tracking-widest gap-2 h-11 px-6 shadow-lg hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase">New Safety Measure</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMeasure.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-black text-[10px] tracking-widest text-muted-foreground">Hazard Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Excessive noise in Sector 4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actionTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-black text-[10px] tracking-widest text-muted-foreground">Action Taken</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Installed composite acoustic paneling" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 font-black uppercase tracking-widest shadow-xl"
                  disabled={createMeasure.isPending}
                >
                  {createMeasure.isPending ? "Syncing..." : "Publish Improvement"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {measures?.map((measure, index) => (
          <motion.div
            key={measure.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group hover:border-primary/50 transition-all shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={
                        measure.status === 'completed' ? "bg-green-500 hover:bg-green-600" :
                        measure.status === 'in_progress' ? "bg-blue-500 hover:bg-blue-600" :
                        "bg-zinc-500 hover:bg-zinc-600"
                      }>
                        {measure.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {measure.createdAt ? format(new Date(measure.createdAt), 'MMM d, yyyy') : 'No date'}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      Issue: {measure.description}
                    </CardTitle>
                  </div>
                  {measure.status === 'completed' && (
                    <div className="p-2 bg-green-500/10 rounded-full">
                       <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Resolution Action</p>
                      <p className="text-foreground leading-relaxed italic">{measure.actionTaken}</p>
                    </div>
                  </div>
                </div>
                {measure.completedAt && (
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mt-4 tracking-tighter">
                    Verified & Closed on {format(new Date(measure.completedAt), 'MMMM do, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
