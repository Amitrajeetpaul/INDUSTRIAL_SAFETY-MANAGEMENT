import { useRisks } from "@/hooks/use-risks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRiskSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, Plus, Zap, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Risks() {
  const { risks, isLoading, createRisk } = useRisks();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof insertRiskSchema>>({
    resolver: zodResolver(insertRiskSchema),
    defaultValues: {
      hazard: "",
      description: "",
      riskLevel: "medium",
      mitigation: "",
    },
  });

  async function onSubmit(values: z.infer<typeof insertRiskSchema>) {
    try {
      await createRisk.mutateAsync(values);
      setOpen(false);
      form.reset();
    } catch (error) {
      // Handled by hook
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Risk Assessment</h1>
          <p className="text-muted-foreground">Identify and mitigate potential workplace hazards</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Hazard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Log New Hazard</DialogTitle>
              <DialogDescription>
                Record a potential risk for assessment and mitigation planning.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="hazard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hazard Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Exposed Wiring" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Risk</SelectItem>
                          <SelectItem value="medium">Medium Risk</SelectItem>
                          <SelectItem value="high">High Risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the hazard..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mitigation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposed Mitigation</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How can this be fixed?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createRisk.isPending}>
                  {createRisk.isPending ? "Saving..." : "Save Risk Assessment"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {risks?.map((risk: any) => (
          <Card key={risk.id} className={cn(
            "border-l-4 transition-all hover:shadow-lg",
            risk.riskLevel === 'high' ? "border-l-destructive" :
            risk.riskLevel === 'medium' ? "border-l-amber-500" :
            "border-l-blue-500"
          )}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                   {risk.riskLevel === 'high' ? <Zap className="w-5 h-5 text-destructive" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
                   <CardTitle className="text-lg font-bold">{risk.hazard}</CardTitle>
                </div>
                <Badge variant={risk.riskLevel === 'high' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                  {risk.riskLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4 min-h-[40px]">{risk.description}</p>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Mitigation Plan</p>
                <p className="text-sm">{risk.mitigation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {risks?.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
            No risks identified yet. Use the "Add Hazard" button to begin assessment.
          </div>
        )}
      </div>
    </div>
  );
}
