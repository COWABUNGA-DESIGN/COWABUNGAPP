import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderCardNew } from "@/components/WorkOrderCardNew";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect } from "wouter";
import type { WorkOrder } from "@shared/schema";

export default function AdvisorDashboard() {
  const { data: user } = useAuth();
  const { toast } = useToast();

  const { data: demands = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/demands"],
  });

  if (!user || (user.role !== "technical_advisor" && user.role !== "admin")) {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">
          {user.role === "admin" ? "Work Order Review" : "Pending Demands"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {user.role === "admin"
            ? "Review and manage all work order demands"
            : "Review work order demands from technicians"}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading demands...</div>
      ) : demands.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              No pending demands to review
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="text-sm text-muted-foreground">
            Found {demands.length} pending demand{demands.length !== 1 ? "s" : ""}
          </div>
          {demands.map((demand) => (
            <WorkOrderCardNew
              key={demand.id}
              workOrder={demand}
              showPunchButtons={false}
              showAssignButtons={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
