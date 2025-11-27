import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const workOrderSchema = z.object({
  title: z.string().min(3, "Title is required"),
  customer: z.string().min(1, "Customer name is required"),
  siteAddress: z.string().min(1, "Site address is required"),
  asset: z.string().min(1, "Asset/Equipment is required"),
  problemSummary: z.string().min(10, "Problem summary must be at least 10 characters"),
  priority: z.enum(["Normal", "High", "Urgent"]).default("Normal"),
  department: z.enum(["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"]).default("Road Technician"),
  headquarters: z.enum(["Montreal, QC", "Quebec, QC", "Saguenay, QC"]).default("Montreal, QC"),
});

type FormData = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkOrderForm({ open, onOpenChange }: WorkOrderFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: "",
      customer: "",
      siteAddress: "",
      asset: "",
      problemSummary: "",
      priority: "Normal",
      department: "Road Technician",
      headquarters: "Montreal, QC",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/work-orders", data);

      toast({
        title: "Work order created successfully",
        description: "Your work order request has been submitted.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create work order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Work Order</DialogTitle>
          <DialogDescription>Fill in the details to request a new work order</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Order Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Lift maintenance, Equipment repair" {...field} data-testid="input-wo-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} data-testid="input-wo-customer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} data-testid="input-wo-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Asset and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset/Equipment</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lift Model XYZ-100" {...field} data-testid="input-wo-asset" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wo-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Department and Headquarters */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wo-department">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Road Technician">Road Technician</SelectItem>
                        <SelectItem value="Garage Technician">Garage Technician</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Tech Advisor">Tech Advisor</SelectItem>
                        <SelectItem value="Accounting">Accounting</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="headquarters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headquarters</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wo-hq">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Montreal, QC">Montreal, QC</SelectItem>
                        <SelectItem value="Quebec, QC">Quebec, QC</SelectItem>
                        <SelectItem value="Saguenay, QC">Saguenay, QC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Problem Summary */}
            <FormField
              control={form.control}
              name="problemSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue or work needed..."
                      {...field}
                      data-testid="textarea-wo-problem"
                      className="min-h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-wo">
                {isSubmitting ? "Creating..." : "Create Work Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
