import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WorkOrderCardProps {
  id: string;
  status: 'new' | 'assigned' | 'in-progress' | 'completed';
  customerName: string;
  equipmentType: string;
  partNumber: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const statusColors = {
  'new': 'bg-blue-500 neon-glow',
  'assigned': 'bg-yellow-500',
  'in-progress': 'bg-orange-500 neon-glow-pink',
  'completed': 'bg-green-500 neon-glow',
};

const priorityColors = {
  'low': 'bg-gray-500',
  'medium': 'bg-yellow-500',
  'high': 'bg-red-500',
};

export function WorkOrderCard({ 
  id, 
  status, 
  customerName, 
  equipmentType, 
  partNumber, 
  assignedTo,
  priority,
  createdAt 
}: WorkOrderCardProps) {
  return (
    <Card className="neon-card fade-in-up" data-testid={`card-workorder-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-base font-semibold neon-text">WO-{id}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <span className={`w-2 h-2 rounded-full ${statusColors[status]} mr-1`}></span>
            {status.replace('-', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className={`text-xs ${priorityColors[priority]}/10 border-${priorityColors[priority]}`}>
            {priority.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <i className="fas fa-user text-muted-foreground w-4"></i>
            <span className="font-medium neon-text" data-testid={`text-customer-${id}`}>{customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <i className="fas fa-forklift w-4"></i>
            <span>{equipmentType}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <i className="fas fa-hashtag w-4"></i>
            <span>{partNumber}</span>
          </div>
        </div>

        {assignedTo && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {assignedTo.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">Assigned to {assignedTo}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{createdAt}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" data-testid={`button-view-${id}`}>
              <i className="fas fa-eye mr-1"></i>
              View
            </Button>
            <Button size="sm" data-testid={`button-assign-${id}`}>
              <i className="fas fa-user-plus mr-1"></i>
              Assign
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}