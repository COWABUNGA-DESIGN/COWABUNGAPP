import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Warranty() {
  const claims = [
    { id: 'WC-124', equipment: 'Forklift EL-5000', issue: 'Hydraulic pump failure', status: 'pending', submittedDate: 'Dec 10, 2024' },
    { id: 'WC-125', equipment: 'Scissor Lift SC-3200', issue: 'Battery malfunction', status: 'approved', submittedDate: 'Dec 12, 2024' },
    { id: 'WC-126', equipment: 'Pallet Jack PJ-2000', issue: 'Wheel bearing damage', status: 'under-review', submittedDate: 'Dec 15, 2024' },
  ];

  const statusColors = {
    'pending': 'secondary',
    'approved': 'default',
    'under-review': 'outline',
    'rejected': 'destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warranty Claims</h1>
          <p className="text-muted-foreground mt-1">Submit and track warranty claims</p>
        </div>
        <Button data-testid="button-new-claim">
          <i className="fas fa-plus mr-2"></i>
          New Claim
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search claims..."
          className="max-w-xs"
          data-testid="input-search-claims"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warranty Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                  <TableCell className="font-mono font-medium">{claim.id}</TableCell>
                  <TableCell>{claim.equipment}</TableCell>
                  <TableCell>{claim.issue}</TableCell>
                  <TableCell>{claim.submittedDate}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[claim.status as keyof typeof statusColors] as any}>
                      {claim.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" data-testid={`button-view-claim-${claim.id}`}>
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-upload-${claim.id}`}>
                        <i className="fas fa-paperclip"></i>
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
