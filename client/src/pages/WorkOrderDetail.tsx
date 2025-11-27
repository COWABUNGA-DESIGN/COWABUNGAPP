import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Clock, PlayCircle, StopCircle, User, Edit2, Save, FileUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrder, WorkOrderTask, TimePunch } from "@shared/schema";

interface WorkOrderWithDetails extends WorkOrder {
  tasks?: WorkOrderTask[];
  punches?: TimePunch[];
}

export default function WorkOrderDetail() {
  const { workOrderNumber } = useParams();
  const [, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: workOrder, isLoading } = useQuery<WorkOrderWithDetails>({
    queryKey: ["/api/work-orders/number", workOrderNumber],
  });

  const { data: currentPunch } = useQuery<TimePunch | null>({
    queryKey: ["/api/time-punches/current"],
  });

  const { data: allPunches = [] } = useQuery<TimePunch[]>({
    queryKey: ["/api/work-orders", workOrder?.id, "punches"],
    enabled: !!workOrder?.id,
  });

  const { data: punchTechUser } = useQuery<{ username: string } | null>({
    queryKey: ["/api/users", currentPunch?.userId],
    enabled: !!currentPunch?.userId,
  });

  // Set notes text when workOrder loads
  useEffect(() => {
    if (workOrder?.notes && notesText === "") {
      setNotesText(workOrder.notes);
    }
  }, [workOrder?.notes]);

  const closeWorkOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/work-orders/${workOrder?.id}/close`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ 
        title: "Work order closed", 
        description: "Efficiency and costs calculated" 
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/work-orders/${workOrder?.id}/notes`, { notes: notesText });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setIsEditingNotes(false);
      toast({ title: "Notes saved" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save notes",
      });
    },
  });

  const updatePhotosMutation = useMutation({
    mutationFn: async (photos: string[]) => {
      const res = await apiRequest("PATCH", `/api/work-orders/${workOrder?.id}/photos`, { photos });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Photo added successfully" });
      setUploadingPhoto(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add photo",
      });
      setUploadingPhoto(false);
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch("/api/upload/photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const { filePath } = await response.json();
      const newPhotos = [...(workOrder?.photos || []), filePath];
      updatePhotosMutation.mutate(newPhotos);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload photo",
      });
      setUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <XCircle className="h-16 w-16 text-muted-foreground" />
        <div className="text-xl font-semibold">Work Order Not Found</div>
        <Button onClick={() => setLocation("/work-orders")} data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Work Orders
        </Button>
      </div>
    );
  }

  const totalBudgetedHours = workOrder.tasks?.reduce((sum, task) => sum + task.budgetedHours, 0) || 0;
  const isAssignedToMe = workOrder.assignedTo === user?.id;
  const canPunchIn = isAssignedToMe && workOrder.status !== "completed";
  const totalActualHours = allPunches
    .filter(p => p.punchType === "work" && p.clockOut)
    .reduce((sum, punch) => {
      const hours = (new Date(punch.clockOut!).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
  const canClose = isAssignedToMe && workOrder.status !== "completed" && totalActualHours > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/work-orders")}
          data-testid="button-back-top"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-wo-number">{workOrder.workOrderNumber}</h1>
          <p className="text-muted-foreground">{workOrder.title}</p>
        </div>
        <Badge 
          variant={
            workOrder.status === "completed" ? "default" : 
            workOrder.status === "in-progress" ? "default" : 
            "secondary"
          }
          data-testid="badge-status"
        >
          {workOrder.status}
        </Badge>
        <Badge 
          variant={
            workOrder.priority === "Urgent" ? "destructive" : 
            workOrder.priority === "High" ? "default" : 
            "outline"
          }
        >
          {workOrder.priority}
        </Badge>
      </div>

      {/* Active Punch Display */}
      {currentPunch && currentPunch.workOrderId === workOrder.id && currentPunch.punchType === "work" && (
        <Card className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="font-semibold text-green-900 dark:text-green-100">Currently Working</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Technician</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {punchTechUser?.username || "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Punched In</p>
                  <p className="font-medium">{new Date(currentPunch.clockIn).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {(() => {
                      const now = new Date();
                      const start = new Date(currentPunch.clockIn);
                      const minutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return `${hours}h ${mins}m`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close Button */}
      {canClose && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={() => closeWorkOrderMutation.mutate()}
              disabled={closeWorkOrderMutation.isPending}
              variant="default"
              size="lg"
              className="w-full"
              data-testid="button-close-wo"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {closeWorkOrderMutation.isPending ? "Closing..." : "Close Work Order & Calculate Efficiency"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Work Order Info */}
      <Card>
        <CardHeader>
          <CardTitle>Work Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium" data-testid="text-customer">{workOrder.customer}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{workOrder.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Headquarters</p>
              <p className="font-medium">{workOrder.headquarters}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Site Address</p>
              <p className="font-medium">{workOrder.siteAddress}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Asset</p>
              <p className="font-medium" data-testid="text-asset">{workOrder.asset}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Problem Summary</p>
            <p className="text-sm" data-testid="text-problem">{workOrder.problemSummary}</p>
          </div>

          <Separator />

          {/* Notes & Attachments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Notes & Attachments</p>
              {!isEditingNotes && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsEditingNotes(true)}
                  data-testid="button-edit-wo-notes"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Photos Display */}
            {workOrder.photos && workOrder.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {workOrder.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Work order photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md border"
                    data-testid={`img-wo-photo-${index}`}
                  />
                ))}
              </div>
            )}

            {isEditingNotes ? (
              <div className="space-y-2 bg-muted/30 p-3 rounded-md">
                <Textarea
                  placeholder="Add notes or comments..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="min-h-24 text-sm"
                  data-testid="textarea-wo-notes"
                />

                <div className="flex gap-2 flex-wrap">
                  <label className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadingPhoto}
                      asChild
                      data-testid="button-wo-upload-photo"
                    >
                      <span>
                        <FileUp className="h-3 w-3 mr-1" />
                        {uploadingPhoto ? "Uploading..." : "Add Photo"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                      data-testid="input-wo-photo"
                    />
                  </label>

                  <Button
                    size="sm"
                    onClick={() => updateNotesMutation.mutate()}
                    disabled={updateNotesMutation.isPending}
                    data-testid="button-save-wo-notes"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesText(workOrder?.notes || "");
                    }}
                    data-testid="button-cancel-wo-notes"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 min-h-6 whitespace-pre-wrap bg-muted/10 p-3 rounded-md">
                {workOrder.notes || "No notes yet. Click edit to add notes or attach photos."}
              </p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Budgeted Hours</p>
              <p className="text-2xl font-bold">{totalBudgetedHours.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual Hours</p>
              <p className="text-2xl font-bold">{totalActualHours.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efficiency</p>
              <p className="text-2xl font-bold">
                {totalActualHours > 0 ? `${(totalBudgetedHours / totalActualHours * 100).toFixed(0)}%` : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks with Time Punching */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks & Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workOrder.tasks?.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              workOrderId={workOrder.id}
              workOrderNumber={workOrder.workOrderNumber}
              punches={allPunches}
              currentPunch={currentPunch ?? null}
              canPunchIn={canPunchIn}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface TaskCardProps {
  task: WorkOrderTask;
  index: number;
  workOrderId: string;
  workOrderNumber: string;
  punches: TimePunch[];
  currentPunch: TimePunch | null;
  canPunchIn: boolean;
}

function TaskCard({
  task,
  index,
  workOrderId,
  workOrderNumber,
  punches,
  currentPunch,
  canPunchIn,
}: TaskCardProps) {
  const { toast } = useToast();

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
      const res = await apiRequest("POST", `/api/tasks/${task.id}/punch`, { workOrderId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Punched in", description: `Started: ${task.title}` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tasks/${task.id}/punch`, { workOrderId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Punched out", description: `Stopped: ${task.title}` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Task {index + 1}: {task.title}</CardTitle>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            )}
          </div>
          <div className="space-y-3 text-right">
            <div>
              <p className="text-sm text-muted-foreground">Budgeted</p>
              <p className="text-lg font-semibold">{task.budgetedHours.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold" data-testid={`text-time-remaining-${index}`}>
                {Math.max(0, task.budgetedHours - totalHours).toFixed(1)}h
              </p>
            </div>
            {totalHours > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className={`text-lg font-semibold ${
                  (task.budgetedHours / totalHours) * 100 >= 100 ? 'text-green-600' :
                  (task.budgetedHours / totalHours) * 100 >= 80 ? 'text-yellow-600' :
                  'text-red-600'
                }`} data-testid={`text-efficiency-${index}`}>
                  {((task.budgetedHours / totalHours) * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Punch Controls */}
        {canPunchIn && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => isPunchedIntoTask ? punchOutMutation.mutate() : punchInMutation.mutate()}
              disabled={punchInMutation.isPending || punchOutMutation.isPending || (!!currentPunch && !isPunchedIntoTask)}
              variant={isPunchedIntoTask ? "destructive" : "default"}
              size="lg"
              className="flex-1"
              data-testid={`button-punch-task-${index}`}
            >
              {isPunchedIntoTask ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Stop Task
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start Task
                </>
              )}
            </Button>
          </div>
        )}

        {/* Time Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Time Worked:</span>
          </div>
          <span className="text-lg font-bold">{totalHours.toFixed(2)} hours</span>
        </div>

        {/* Time Entries */}
        {taskPunches.filter(p => p.punchType === "work").length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Time Entries</p>
            <div className="space-y-1">
              {taskPunches
                .filter(p => p.punchType === "work")
                .map((punch) => {
                  const start = new Date(punch.clockIn);
                  const end = punch.clockOut ? new Date(punch.clockOut) : null;
                  const duration = end
                    ? ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2)
                    : "In progress";

                  return (
                    <div
                      key={punch.id}
                      className="flex items-center justify-between p-2 border rounded text-sm"
                      data-testid={`punch-entry-${punch.id}`}
                    >
                      <span>
                        {start.toLocaleTimeString()} - {end ? end.toLocaleTimeString() : "Now"}
                      </span>
                      <Badge variant="outline">{duration}h</Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
