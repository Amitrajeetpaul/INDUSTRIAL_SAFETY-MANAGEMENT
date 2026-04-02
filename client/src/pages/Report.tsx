import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertIncidentSchema } from "@shared/schema";
import { useIncidents } from "@/hooks/use-incidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Upload } from "lucide-react";
import { useLocation } from "wouter";

export default function Report() {
  const { createIncident } = useIncidents();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof insertIncidentSchema>>({
    resolver: zodResolver(insertIncidentSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      severity: "low",
      imageUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof insertIncidentSchema>) {
    try {
      await createIncident.mutateAsync(values);
      setLocation("/incidents");
    } catch (error) {
      // Error handled by hook
    }
  }

  // Helper to set a mock image
  const setMockImage = () => {
    form.setValue("imageUrl", "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=800&auto=format&fit=crop");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <AlertTriangle className="text-primary w-8 h-8" />
          Report Incident
        </h1>
        <p className="text-muted-foreground mt-2">
          Fill out the form below to report a safety hazard or incident. Immediate reporting prevents accidents.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg">
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>All fields are required for proper assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chemical Spill in Zone A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Warehouse Block B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Minor issue, no immediate danger</SelectItem>
                        <SelectItem value="medium">Medium - Potential for injury</SelectItem>
                        <SelectItem value="high">High - Serious hazard, immediate attention needed</SelectItem>
                        <SelectItem value="critical">Critical - Life threatening situation</SelectItem>
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
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe exactly what happened, who was involved, and current status..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Evidence (Optional)</FormLabel>
                <div className="flex gap-4 items-center">
                  <Input 
                    placeholder="Image URL..." 
                    {...form.register("imageUrl")} 
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={setMockImage}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Mock
                  </Button>
                </div>
                {form.watch("imageUrl") && (
                   <div className="mt-2 relative rounded-lg overflow-hidden h-40 w-full border">
                     <img src={form.watch("imageUrl") || ""} alt="Preview" className="w-full h-full object-cover" />
                   </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation("/")}>Cancel</Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 font-bold min-w-[150px]"
                  disabled={createIncident.isPending}
                >
                  {createIncident.isPending ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
