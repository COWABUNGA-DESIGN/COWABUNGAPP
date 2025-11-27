import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { WorkOrderForm } from "@/components/WorkOrderForm";
import { DemandForm } from "@/components/DemandForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateWorkOrder() {
  const { data: user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Create Work Order</h1>
        <p className="text-muted-foreground mt-2">
          {user.role === "technician"
            ? "Submit a work demand to your technical advisor"
            : "Create a new work order with tasks and budgets"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {user.role === "technician" ? "Work Demand Form" : "Work Order Form"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.role === "technician" ? (
            <DemandForm />
          ) : (
            <WorkOrderForm open={true} onOpenChange={() => {}} isEmbedded={true} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
