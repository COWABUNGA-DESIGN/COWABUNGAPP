import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { 
  Search, Truck, Warehouse, Package, Plus, Edit2, MapPin, AlertCircle,
  Zap, Building2, PackageOpen, Wrench
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMachineSchema } from "@shared/schema";
import type { Machine } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";

type MachineFormData = z.infer<typeof insertMachineSchema>;

export default function Rental() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [rentalLocation, setRentalLocation] = useState("");
  const { toast } = useToast();

  const { data: machines = [], isLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  // Filter for available machines (in-stock or active)
  const availableMachines = machines.filter(m => 
    (m.status === "in-stock" || m.status === "active") &&
    (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeRentals = machines.filter(m => m.status === "active").length;
  const totalAvailable = machines.filter(m => m.status === "in-stock").length;
  const inMaintenance = machines.filter(m => m.status === "maintenance").length;

  // Create machine form
  const form = useForm<MachineFormData>({
    resolver: zodResolver(insertMachineSchema),
    defaultValues: {
      name: "",
      model: "",
      serialNumber: "",
      category: "Lift",
      status: "in-stock",
      location: "",
    },
  });

  const createMachineMutation = useMutation({
    mutationFn: async (data: MachineFormData) => {
      const res = await apiRequest("POST", "/api/machines", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "Success", description: "Machine added to inventory" });
      setAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rentMachineMutation = useMutation({
    mutationFn: async (machineId: string) => {
      if (!rentalLocation) throw new Error("Location is required");
      const res = await apiRequest("PATCH", `/api/machines/${machineId}`, {
        status: "active",
        location: rentalLocation,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "Success", description: "Machine rented successfully" });
      setRentDialogOpen(false);
      setRentalLocation("");
      setSelectedMachine(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const returnMachineMutation = useMutation({
    mutationFn: async (machineId: string) => {
      const res = await apiRequest("PATCH", `/api/machines/${machineId}`, {
        status: "in-stock",
        location: null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({ title: "Success", description: "Machine returned to inventory" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Lift": return Zap;
      case "Hoist": return Truck;
      case "Platform": return Building2;
      case "Stairs": return Wrench;
      case "Ramp": return PackageOpen;
      default: return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in-stock":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "retired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleAddMachine = (data: MachineFormData) => {
    createMachineMutation.mutate(data);
  };

  const handleRentMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setRentDialogOpen(true);
  };

  const confirmRent = () => {
    if (selectedMachine) {
      rentMachineMutation.mutate(selectedMachine.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipment & Rentals</h1>
          <p className="text-muted-foreground mt-1">Manage equipment inventory and rentals</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-machine">
              <Plus className="w-4 h-4 mr-2" />
              Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Machine to Inventory</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddMachine)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Scissor Lift 4000" {...field} data-testid="input-machine-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., SL-4000X" {...field} data-testid="input-machine-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Unique serial number" {...field} data-testid="input-serial-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Lift">Lift</SelectItem>
                          <SelectItem value="Hoist">Hoist</SelectItem>
                          <SelectItem value="Platform">Platform</SelectItem>
                          <SelectItem value="Stairs">Stairs</SelectItem>
                          <SelectItem value="Ramp">Ramp</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMachineMutation.isPending}
                  data-testid="button-create-machine"
                >
                  {createMachineMutation.isPending ? "Adding..." : "Add Machine"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Rentals"
          value={String(activeRentals)}
          icon={Truck}
          trend={`${activeRentals} units deployed`}
          trendUp={activeRentals > 0}
        />
        <StatCard
          title="Available"
          value={String(totalAvailable)}
          icon={Warehouse}
          trend="Ready to rent"
        />
        <StatCard
          title="In Maintenance"
          value={String(inMaintenance)}
          icon={Wrench}
          trend="Being serviced"
        />
        <StatCard
          title="Total Fleet"
          value={String(machines.length)}
          icon={Package}
          trend={`${new Set(machines.map(m => m.category)).size} types`}
        />
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search machines, models, serial numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-equipment"
          />
        </div>
      </div>

      {/* Equipment List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Equipment</h2>
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading equipment...</p>
          </div>
        ) : availableMachines.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Warehouse className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No available equipment found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMachines.map((machine) => {
              const IconComponent = getCategoryIcon(machine.category);
              return (
                <Card 
                  key={machine.id} 
                  className="hover-elevate transition-all overflow-hidden" 
                  data-testid={`card-equipment-${machine.id}`}
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{machine.name}</CardTitle>
                          <p className="text-sm text-muted-foreground font-mono truncate">{machine.model}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(machine.status)} border-0 flex-shrink-0`}>
                        {machine.status === "in-stock" ? "Available" : machine.status === "active" ? "Active" : machine.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Serial Number</p>
                        <p className="font-mono break-all">{machine.serialNumber}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-medium">{machine.category}</p>
                      </div>

                      {machine.location && (
                        <div className="flex items-start gap-2 bg-muted/50 p-2 rounded">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Current Location</p>
                            <p className="font-medium">{machine.location}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      {machine.status === "in-stock" ? (
                        <Button 
                          className="w-full" 
                          variant="default"
                          onClick={() => handleRentMachine(machine)}
                          data-testid={`button-rent-${machine.id}`}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Rent Now
                        </Button>
                      ) : machine.status === "active" ? (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => returnMachineMutation.mutate(machine.id)}
                          disabled={returnMachineMutation.isPending}
                          data-testid={`button-return-${machine.id}`}
                        >
                          <PackageOpen className="w-4 h-4 mr-2" />
                          Return to Inventory
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Rent Machine Dialog */}
      <Dialog open={rentDialogOpen} onOpenChange={setRentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rent Machine: {selectedMachine?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Serial Number</p>
              <p className="font-mono">{selectedMachine?.serialNumber}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rental Location</label>
              <Input
                placeholder="Enter customer location or site address"
                value={rentalLocation}
                onChange={(e) => setRentalLocation(e.target.value)}
                data-testid="input-rental-location"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setRentDialogOpen(false)}
                data-testid="button-cancel-rent"
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={confirmRent}
                disabled={!rentalLocation || rentMachineMutation.isPending}
                data-testid="button-confirm-rent"
              >
                {rentMachineMutation.isPending ? "Processing..." : "Confirm Rental"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
