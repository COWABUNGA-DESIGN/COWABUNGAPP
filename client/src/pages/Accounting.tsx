import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Accounting() {
  const pendingInvoices = [
    { id: 'INV-5824', customer: 'Montreal Distribution', amount: 12450.00, dueDate: 'Dec 20, 2024', status: 'pending' },
    { id: 'INV-5825', customer: 'Laval Logistics', amount: 8750.00, dueDate: 'Dec 22, 2024', status: 'overdue' },
    { id: 'INV-5826', customer: 'Quebec Warehouse', amount: 5200.00, dueDate: 'Dec 25, 2024', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
          <p className="text-muted-foreground mt-1">Financial management and billing</p>
        </div>
        <Button data-testid="button-new-invoice">
          <i className="fas fa-plus mr-2"></i>
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Outstanding"
          value="$26,400"
          icon="fa-clock"
        />
        <StatCard
          title="Paid This Month"
          value="$142,850"
          icon="fa-check-circle"
          change="+15.2%"
          changeType="positive"
        />
        <StatCard
          title="Pending Invoices"
          value="8"
          icon="fa-file-invoice"
        />
        <StatCard
          title="Overdue"
          value="$8,750"
          icon="fa-exclamation-circle"
          changeType="negative"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvoices.map((invoice) => (
                <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                  <TableCell className="font-mono font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    ${invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" data-testid={`button-view-invoice-${invoice.id}`}>
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button size="sm" data-testid={`button-send-invoice-${invoice.id}`}>
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
