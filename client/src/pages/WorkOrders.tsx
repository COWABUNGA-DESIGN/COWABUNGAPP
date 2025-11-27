import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WorkOrderCardNew } from "@/components/WorkOrderCardNew";
import { WorkOrderForm } from "@/components/WorkOrderForm";
import { DemandForm } from "@/components/DemandForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, PauseCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkOrder, TimePunch } from "@shared/schema";

export default function WorkOrders() {
  const [formOpen, setFormOpen] = useState(false);
  const [demandFormOpen, setDemandFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { data: currentUser } = useAuth();

  const { data: workOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: currentPunch } = useQuery<TimePunch | null>({
    queryKey: ["/api/time-punches/current"],
  });

  // Get all active punches for all users - real-time sync
  const { data: allPunches = [] } = useQuery<TimePunch[]>({
    queryKey: ["/api/time-punches"],
    refetchInterval: 1000,
  });

  const punchOutMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrderId}/punch-out`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Punched out", description: "Work session ended" });
    },
  });

  const activeWorkOrder = currentPunch?.workOrderId
    ? workOrders?.find((wo) => wo.id === currentPunch.workOrderId)
    : null;

  // Get all active work order punches
  const activeWorkOrderPunches = allPunches.filter(
    (punch) => punch.punchType === "work" && !punch.clockOut && punch.workOrderId
  );

  // Get work orders for active punches (excluding current user's active punch)
  const otherActiveWorkOrders = activeWorkOrderPunches
    .filter((punch) => punch.userId !== currentUser?.id)
    .map((punch) => workOrders?.find((wo) => wo.id === punch.workOrderId))
    .filter((wo): wo is WorkOrder => wo !== undefined);

  const isTechnicalAdvisor = currentUser?.role === "technical_advisor";
  const isTechnician = currentUser?.role === "technician";
  const canCreateFullWorkOrder = currentUser?.role === "admin" || currentUser?.role === "technical_advisor";

  const filteredWorkOrders = workOrders?.filter((wo) => {
    // Technical advisors only see unassigned NEW demands
    if (isTechnicalAdvisor) {
      if (wo.assignedTo || wo.status !== "new") {
        return false;
      }
    }
    
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      wo.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  return (
    <div className="space-y-8 py-2">
      <div className="px-2 md:px-4 space-y-3">
        <h1 className="text-5xl font-bold gradient-text">
          {isTechnicalAdvisor ? "Service Demands" : "Work Orders"}
        </h1>
        <p className="text-lg text-muted-foreground">
          {isTechnicalAdvisor ? "New service requests awaiting assignment" : "Manage and track all service requests"}
        </p>
      </div>
      <div className="flex items-center justify-between px-2 md:px-4">
        {canCreateFullWorkOrder ? (
          <Button onClick={() => setFormOpen(true)} data-testid="button-create-workorder">
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        ) : isTechnician ? (
          <Button onClick={() => setDemandFormOpen(true)} data-testid="button-request-workorder">
            <Plus className="h-4 w-4 mr-2" />
            Request Work Order
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by work order number, customer, asset..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-workorders"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeWorkOrder && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Currently Working On</h2>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg" data-testid="text-active-wo-number">
                    {activeWorkOrder.workOrderNumber}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{activeWorkOrder.title}</p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => punchOutMutation.mutate(activeWorkOrder.id)}
                  disabled={punchOutMutation.isPending}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-punch-out-active"
                >
                  <PauseCircle className="mr-2 h-4 w-4" />
                  {punchOutMutation.isPending ? "Punching out..." : "Punch Out"}
                </Button>
                <Button
                  onClick={() => (window.location.href = `/work-orders/${activeWorkOrder.workOrderNumber}`)}
                  className="flex-1"
                  data-testid="button-view-active"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Work Orders - All Technicians */}
      {otherActiveWorkOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Active Work Orders - Other Technicians
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-4">
            {otherActiveWorkOrders.map((wo) => (
              <WorkOrderCardNew
                key={wo.id}
                workOrder={wo}
                showPunchButtons={false}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">All Work Orders</h2>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading work orders...</div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No work orders found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-4">
            {filteredWorkOrders.map((wo) => {
              const isActive = wo.status !== "completed" && wo.status !== "closedForReview";
              const isTechnician = currentUser?.role === "technician";
              const isAdmin = currentUser?.role === "admin";
              const canPunch = (isTechnician || isAdmin) && isActive;
              
              return (
                <WorkOrderCardNew 
                  key={wo.id} 
                  workOrder={wo} 
                  showPunchButtons={canPunch}
                />
              );
            })}
          </div>
        )}
      </div>

      <WorkOrderForm open={formOpen} onOpenChange={setFormOpen} />
      <DemandForm open={demandFormOpen} onOpenChange={setDemandFormOpen} />
    </div>
  );
}
