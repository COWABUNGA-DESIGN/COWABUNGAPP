import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { 
  Search, Plus, Edit2, Trash2, AlertTriangle, Package, Warehouse, AlertCircle,
  Zap, Wrench, Cog, Cpu
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
import { insertPartSchema } from "@shared/schema";
import type { Part } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

type PartFormData = z.infer<typeof insertPartSchema>;

export default function Parts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: parts = [], isLoading } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  // Filter parts based on search
  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // Calculate stats
  const totalParts = parts.length;
  const totalValue = parts.reduce((sum, p) => sum + ((p.unitCost || 0) * p.quantity), 0);
  const lowStockParts = parts.filter(p => p.quantity <= (p.reorderLevel || 5)).length;
  const totalQuantity = parts.reduce((sum, p) => sum + p.quantity, 0);

  // Add part form
  const addForm = useForm<PartFormData>({
    resolver: zodResolver(insertPartSchema),
    defaultValues: {
      name: "",
      partNumber: "",
      category: "Motor",
      quantity: 0,
      unitCost: undefined,
      supplier: "",
      location: "",
      description: "",
      reorderLevel: 5,
    },
  });

  // Edit part form
  const editForm = useForm<PartFormData>({
    resolver: zodResolver(insertPartSchema),
    defaultValues: {
      name: editingPart?.name || "",
      partNumber: editingPart?.partNumber || "",
      category: (editingPart?.category || "Motor") as any,
      quantity: editingPart?.quantity ?? 0,
      unitCost: editingPart?.unitCost ?? undefined,
      supplier: editingPart?.supplier || "",
      location: editingPart?.location || "",
      description: editingPart?.description || "",
      reorderLevel: editingPart?.reorderLevel ?? 5,
    },
  });

  const createPartMutation = useMutation({
    mutationFn: async (data: PartFormData) => {
      const res = await apiRequest("POST", "/api/parts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      toast({ title: "Success", description: "Part added to inventory" });
      setAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: async (data: PartFormData) => {
      if (!editingPart) throw new Error("No part selected");
      const res = await apiRequest("PATCH", `/api/parts/${editingPart.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      toast({ title: "Success", description: "Part updated successfully" });
      setEditDialogOpen(false);
      setEditingPart(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const res = await apiRequest("DELETE", `/api/parts/${partId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      toast({ title: "Success", description: "Part deleted from inventory" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Motor": return Zap;
      case "Gear": return Cog;
      case "Bearing": return Wrench;
      case "Hydraulic": return Cpu;
      case "Electrical": return Zap;
      case "Fastener": return Package;
      default: return Package;
    }
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity <= reorderLevel) return "low-stock";
    return "in-stock";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in-stock":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    editForm.reset({
      name: part.name,
      partNumber: part.partNumber,
      category: part.category,
      quantity: part.quantity,
      unitCost: part.unitCost,
      supplier: part.supplier || "",
      location: part.location || "",
      description: part.description || "",
      reorderLevel: part.reorderLevel || 5,
    });
    setEditDialogOpen(true);
  };

  const handleAddPart = (data: PartFormData) => {
    createPartMutation.mutate(data);
  };

  const handleUpdatePart = (data: PartFormData) => {
    updatePartMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parts Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage replacement parts and stock levels</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-part">
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Part to Inventory</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddPart)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Electric Motor" {...field} data-testid="input-part-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="partNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MOTOR-001" {...field} data-testid="input-part-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
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
                          <SelectItem value="Motor">Motor</SelectItem>
                          <SelectItem value="Gear">Gear</SelectItem>
                          <SelectItem value="Bearing">Bearing</SelectItem>
                          <SelectItem value="Hydraulic">Hydraulic</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Fastener">Fastener</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-unit-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          value={field.value ?? 5}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-reorder-level"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., AcmeCorp" 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-supplier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Warehouse A-5" 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Optional details" 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createPartMutation.isPending}
                  data-testid="button-create-part"
                >
                  {createPartMutation.isPending ? "Adding..." : "Add Part"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Parts"
          value={String(totalParts)}
          icon={Package}
          trend={`${totalQuantity} units in stock`}
        />
        <StatCard
          title="Inventory Value"
          value={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Warehouse}
          trend="Total stock value"
        />
        <StatCard
          title="Low Stock"
          value={String(lowStockParts)}
          icon={AlertTriangle}
          trend={`${lowStockParts} parts need reorder`}
          trendUp={lowStockParts > 0}
        />
        <StatCard
          title="Categories"
          value={String(new Set(parts.map(p => p.category)).size)}
          icon={Package}
          trend="Different types"
        />
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts, part numbers, suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-parts"
          />
        </div>
      </div>

      {/* Parts Grid */}
      <div>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading parts inventory...</p>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No parts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParts.map((part) => {
              const IconComponent = getCategoryIcon(part.category);
              const stockStatus = getStockStatus(part.quantity, part.reorderLevel || 5);
              return (
                <Card 
                  key={part.id}
                  className="hover-elevate transition-all overflow-hidden"
                  data-testid={`card-part-${part.id}`}
                >
                  <CardHeader className="pb-3 bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{part.name}</CardTitle>
                          <p className="text-sm text-muted-foreground font-mono truncate">{part.partNumber}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(stockStatus)} border-0 flex-shrink-0`}>
                        {stockStatus === "out-of-stock" ? "Out" : stockStatus === "low-stock" ? "Low" : "OK"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className={`text-lg font-bold ${
                          part.quantity === 0 ? "text-red-600 dark:text-red-400" :
                          part.quantity <= (part.reorderLevel || 5) ? "text-yellow-600 dark:text-yellow-400" : ""
                        }`}>
                          {part.quantity}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Reorder Level</p>
                        <p className="font-medium">{part.reorderLevel || 5}</p>
                      </div>

                      {part.unitCost && (
                        <div>
                          <p className="text-xs text-muted-foreground">Unit Cost</p>
                          <p className="font-semibold">${part.unitCost.toFixed(2)}</p>
                        </div>
                      )}

                      {part.supplier && (
                        <div>
                          <p className="text-xs text-muted-foreground">Supplier</p>
                          <p className="text-xs truncate">{part.supplier}</p>
                        </div>
                      )}

                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="text-sm font-medium">{part.category}</p>
                      </div>

                      {part.location && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm">{part.location}</p>
                        </div>
                      )}

                      {part.description && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Description</p>
                          <p className="text-xs text-muted-foreground">{part.description}</p>
                        </div>
                      )}
                    </div>

                    {part.quantity === 0 && (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 p-2 rounded text-red-700 dark:text-red-300 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Out of stock - Order immediately</span>
                      </div>
                    )}

                    {part.quantity > 0 && part.quantity <= (part.reorderLevel || 5) && (
                      <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded text-yellow-700 dark:text-yellow-300 text-xs">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Low stock - Reorder soon</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditPart(part)}
                        data-testid={`button-edit-part-${part.id}`}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => deletePartMutation.mutate(part.id)}
                        disabled={deletePartMutation.isPending}
                        data-testid={`button-delete-part-${part.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Part Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Part: {editingPart?.name}</DialogTitle>
          </DialogHeader>
          {editingPart && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdatePart)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-part-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Motor">Motor</SelectItem>
                          <SelectItem value="Gear">Gear</SelectItem>
                          <SelectItem value="Bearing">Bearing</SelectItem>
                          <SelectItem value="Hydraulic">Hydraulic</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Fastener">Fastener</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-edit-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-edit-unit-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          value={field.value ?? 5}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-edit-reorder-level"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-edit-supplier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-edit-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          data-testid="input-edit-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1"
                    disabled={updatePartMutation.isPending}
                    data-testid="button-save-part"
                  >
                    {updatePartMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
