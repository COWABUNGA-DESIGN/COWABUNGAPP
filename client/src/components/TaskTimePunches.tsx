import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, PlayCircle, PauseCircle, Edit2, Save, X, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrderTask, TimePunch } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TaskWithTimePunchesProps {
  task: WorkOrderTask;
  index: number;
  workOrderId: string;
  workOrderNumber: string;
  punches: TimePunch[];
  currentPunch: TimePunch | null;
  canPunchIn: boolean;
}

export function TaskWithTimePunches({
  task,
  index,
  workOrderId,
  workOrderNumber,
  punches,
  currentPunch,
  canPunchIn,
}: TaskWithTimePunchesProps) {
  const { toast } = useToast();
  const [editingPunch, setEditingPunch] = useState<TimePunch | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");

  const taskPunches = punches.filter(p => p.taskId === task.id);
  const isPunchedIntoTask = currentPunch?.taskId === task.id;
  
  const totalHours = taskPunches.reduce((sum, punch) => {
    if (punch.clockOut && punch.punchType === "work") {
      const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  const punchInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tasks/${task.id}/punch`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ title: "Punched in", description: `Started working on: ${task.title}` });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tasks/${task.id}/punch`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ title: "Punched out", description: `Finished working on: ${task.title}` });
    },
  });

  const updatePunchMutation = useMutation({
    mutationFn: async ({ punchId, clockIn, clockOut }: { punchId: string; clockIn: string; clockOut?: string }) => {
      const res = await apiRequest("PATCH", `/api/time-punches/${punchId}`, { clockIn, clockOut });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ title: "Time updated", description: "Time punch has been updated successfully" });
      setEditingPunch(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePunchMutation = useMutation({
    mutationFn: async (punchId: string) => {
      await apiRequest("DELETE", `/api/time-punches/${punchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ title: "Time deleted", description: "Time punch has been removed" });
    },
  });


  const handleEditPunch = (punch: TimePunch) => {
    setEditingPunch(punch);
    setEditClockIn(formatDateTimeLocal(new Date(punch.clockIn)));
    setEditClockOut(punch.clockOut ? formatDateTimeLocal(new Date(punch.clockOut)) : "");
  };

  const handleSaveEdit = () => {
    if (!editingPunch) return;
    
    updatePunchMutation.mutate({
      punchId: editingPunch.id,
      clockIn: editClockIn,
      clockOut: editClockOut || undefined,
    });
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium">{index + 1}. {task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {task.budgetedHours}h budget
            </Badge>
            {totalHours > 0 && (
              <Badge variant="secondary">
                {totalHours.toFixed(2)}h actual
              </Badge>
            )}
          </div>
        </div>

        {/* Punch In/Out Button and Lunch Break */}
        {canPunchIn && (
          <div className="flex gap-2">
            {!isPunchedIntoTask ? (
              <Button
                size="sm"
                onClick={() => punchInMutation.mutate()}
                disabled={punchInMutation.isPending || !!currentPunch}
                data-testid={`button-punch-in-task-${task.id}`}
                title={currentPunch && !isPunchedIntoTask ? "Clock out of current task first" : ""}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {punchInMutation.isPending ? "Punching in..." : currentPunch ? "Clock Out First" : "Start Task"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => punchOutMutation.mutate()}
                disabled={punchOutMutation.isPending}
                data-testid={`button-punch-out-task-${task.id}`}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                {punchOutMutation.isPending ? "Punching out..." : "Stop Task"}
              </Button>
            )}
          </div>
        )}

        {/* Time Punches List */}
        {taskPunches.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Time Entries</p>
            {taskPunches.map((punch) => (
              <div
                key={punch.id}
                className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"
              >
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium">
                      {new Date(punch.clockIn).toLocaleString()}
                    </p>
                    {punch.clockOut ? (
                      <p className="text-muted-foreground">
                        to {new Date(punch.clockOut).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-primary font-medium">In Progress</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {punch.clockOut && (
                    <Badge variant="outline">
                      {((new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(2)}h
                    </Badge>
                  )}
                  {canPunchIn && punch.punchType === "work" && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditPunch(punch)}
                        data-testid={`button-edit-punch-${punch.id}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePunchMutation.mutate(punch.id)}
                        disabled={deletePunchMutation.isPending}
                        data-testid={`button-delete-punch-${punch.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingPunch} onOpenChange={() => setEditingPunch(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Punch</DialogTitle>
              <DialogDescription>
                Adjust the clock in and clock out times for this time entry.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Clock In</label>
                <Input
                  type="datetime-local"
                  value={editClockIn}
                  onChange={(e) => setEditClockIn(e.target.value)}
                  data-testid="input-edit-clock-in"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Clock Out</label>
                <Input
                  type="datetime-local"
                  value={editClockOut}
                  onChange={(e) => setEditClockOut(e.target.value)}
                  data-testid="input-edit-clock-out"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingPunch(null)}
                data-testid="button-cancel-edit"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updatePunchMutation.isPending}
                data-testid="button-save-edit"
              >
                <Save className="mr-2 h-4 w-4" />
                {updatePunchMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
