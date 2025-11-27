import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";

export default function Sales() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground mt-1">Manage equipment sales and quotes</p>
        </div>
        <Button data-testid="button-new-quote">
          <i className="fas fa-plus mr-2"></i>
          New Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Sales"
          value="$185,420"
          icon="fa-chart-line"
          change="+18.2% from last month"
          changeType="positive"
        />
        <StatCard
          title="Active Quotes"
          value="12"
          icon="fa-file-invoice-dollar"
        />
        <StatCard
          title="This Week"
          value="$42,850"
          icon="fa-calendar-week"
          change="+8.5%"
          changeType="positive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-card border border-card-border rounded-lg hover-elevate">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-forklift text-primary"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold">Electric Forklift EL-5000</h4>
                    <p className="text-sm text-muted-foreground">Customer: Montreal Distribution Inc.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">$45,000</p>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
