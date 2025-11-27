import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wrench, Package } from "lucide-react";
import type { Machine, Part } from "@shared/schema";

export default function Machines() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"machines" | "parts">("machines");

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: parts = [] } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  const filteredMachines = machines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "maintenance": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "retired": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in-stock": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Motor": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Gear": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "Bearing": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "Hydraulic": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Electrical": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "Fastener": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="space-y-3 px-2 md:px-4">
        <h1 className="text-5xl font-bold gradient-text">Equipment & Parts</h1>
        <p className="text-lg text-muted-foreground">Manage machines, parts, and inventory</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 px-2 md:px-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "machines" ? "Search machines..." : "Search parts..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-inventory"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 px-2 md:px-4">
        <Button
          onClick={() => setActiveTab("machines")}
          variant={activeTab === "machines" ? "default" : "outline"}
          className="gap-2"
          data-testid="button-tab-machines"
        >
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Machines</span>
          <span className="sm:hidden text-xs">({filteredMachines.length})</span>
        </Button>
        <Button
          onClick={() => setActiveTab("parts")}
          variant={activeTab === "parts" ? "default" : "outline"}
          className="gap-2"
          data-testid="button-tab-parts"
        >
          <Package className="h-4 w-4" />
          
          <span className="hidden sm:inline">Parts</span>
          <span className="sm:hidden text-xs">({filteredParts.length})</span>
        </Button>
      </div>

      {/* Machines Tab */}
      {activeTab === "machines" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2 md:px-4">
          {filteredMachines.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No machines found</p>
            </div>
          ) : (
            filteredMachines.map((machine) => (
              <Card key={machine.id} className="hover-elevate transition-all" data-testid={`card-machine-${machine.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{machine.name}</CardTitle>
                      <CardDescription className="text-xs">{machine.model}</CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(machine.status)}`}>
                      {machine.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Serial #</p>
                      <p className="font-mono text-xs break-all">{machine.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="capitalize text-xs">{machine.category}</p>
                    </div>
                    {machine.location && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-xs">{machine.location}</p>
                      </div>
                    )}
                    {machine.lastServiceDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Last Service</p>
                        <p className="text-xs">{new Date(machine.lastServiceDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {machine.nextServiceDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Next Service</p>
                        <p className="text-xs">{new Date(machine.nextServiceDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {machine.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2">{machine.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Parts Tab */}
      {activeTab === "parts" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2 md:px-4">
          {filteredParts.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No parts found</p>
            </div>
          ) : (
            filteredParts.map((part) => (
              <Card key={part.id} className="hover-elevate transition-all" data-testid={`card-part-${part.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{part.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">{part.partNumber}</CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getCategoryColor(part.category)}`}>
                      {part.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="text-lg font-bold">{part.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reorder Level</p>
                      <p className={part.quantity <= (part.reorderLevel || 5) ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}>
                        {part.reorderLevel || 5}
                      </p>
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
                        <p className="text-xs">{part.supplier}</p>
                      </div>
                    )}
                    {part.location && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-xs">{part.location}</p>
                      </div>
                    )}
                  </div>
                  {part.description && (
                    <p className="text-xs text-muted-foreground border-t pt-2">{part.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
