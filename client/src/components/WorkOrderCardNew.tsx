import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/lib/auth";
import { Clock, MapPin, User, Wrench, PlayCircle, PauseCircle, Edit2, ChevronDown, ChevronUp, Check, ChevronsUpDown, FileUp, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { WorkOrder, User as UserType, TimePunch, WorkOrderTask } from "@shared/schema";
import hexBg from "@assets/IMG_6738_1763322726659.jpeg";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface WorkOrderCardNewProps {
  workOrder: WorkOrder;
  showPunchButtons?: boolean;
  showAssignButtons?: boolean;
}

export function WorkOrderCardNew({ workOrder, showPunchButtons = false, showAssignButtons = true }: WorkOrderCardNewProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [showAssign, setShowAssign] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [editingPunch, setEditingPunch] = useState<TimePunch | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [openUserSelect, setOpenUserSelect] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(workOrder.notes || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: currentUser } = useAuth();

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: currentPunch } = useQuery<TimePunch | null>({
    queryKey: ["/api/time-punches/current"],
    refetchInterval: 1000, // Sync every second
  });

  const { data: tasks = [] } = useQuery<WorkOrderTask[]>({
    queryKey: ["/api/work-orders", workOrder.id, "tasks"],
  });

  const { data: punches = [] } = useQuery<TimePunch[]>({
    queryKey: ["/api/work-orders", workOrder.id, "punches"],
    refetchInterval: 1000, // Refetch every second to sync active punch status in real-time
  });

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/work-orders/${workOrder.id}/assign`, { userId });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to assign work order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrder.workOrderNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({
        title: "Work order assigned",
        description: "The work order has been assigned successfully.",
      });
      setShowAssign(false);
      setSelectedUserId("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign work order",
      });
    },
  });

  const punchInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrder.id}/punch-in`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to punch in");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrder.id, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ title: "Punched in", description: "Started working on this work order" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to punch in",
      });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrder.id}/punch-out`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to punch out");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrder.id, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      toast({ title: "Punched out", description: "Work session ended" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to punch out",
      });
    },
  });

  const updatePunchMutation = useMutation({
    mutationFn: async ({ id, clockIn, clockOut }: { id: string; clockIn: string; clockOut: string }) => {
      const res = await apiRequest("PATCH", `/api/time-punches/${id}`, { clockIn, clockOut });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update punch");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrder.id, "punches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      setEditingPunch(null);
      toast({ title: "Punch updated", description: "Time entry has been updated" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update punch",
      });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/work-orders/${workOrder.id}/notes`, { notes: notesText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrder.workOrderNumber] });
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
      return apiRequest("PATCH", `/api/work-orders/${workOrder.id}/photos`, { photos });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/number", workOrder.workOrderNumber] });
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
      const newPhotos = [...(workOrder.photos || []), filePath];
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

  const handleEditPunch = (punch: TimePunch) => {
    setEditingPunch(punch);
    setEditClockIn(new Date(punch.clockIn).toISOString().slice(0, 16));
    setEditClockOut(punch.clockOut ? new Date(punch.clockOut).toISOString().slice(0, 16) : "");
  };

  const handleSaveEdit = () => {
    if (!editingPunch || !editClockIn || !editClockOut) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Both clock in and clock out times are required",
      });
      return;
    }
    updatePunchMutation.mutate({
      id: editingPunch.id,
      clockIn: editClockIn,
      clockOut: editClockOut,
    });
  };

  const priorityColor = {
    Normal: "bg-blue-500",
    High: "bg-orange-500",
    Urgent: "bg-red-500",
  }[workOrder.priority];

  const statusColor = {
    new: "bg-purple-500",
    demand: "bg-purple-600",
    assigned: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
    closedForReview: "bg-green-600",
  }[workOrder.status];

  const efficiencyColor = (eff: number | null) => {
    if (!eff) return "text-muted-foreground";
    if (eff >= 100) return "text-green-500";
    if (eff >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  const assignedUser = users?.find((u) => u.id === workOrder.assignedTo);
  const isPunchedIn = currentPunch?.workOrderId === workOrder.id;
  const isAssignedToCurrentUser = currentUser?.id === workOrder.assignedTo;
  const totalBudgetedHours = tasks.reduce((sum, task) => sum + task.budgetedHours, 0);

  // Calculate total hours including active punches
  const calculateTotalHours = () => {
    let total = 0;
    
    // Add completed work hours
    punches.forEach(punch => {
      if (punch.punchType === "work" && punch.clockOut) {
        const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
        total += hours;
      }
    });
    
    // Add current active work punch hours (if any)
    const activePunch = punches.find(p => p.punchType === "work" && !p.clockOut);
    if (activePunch) {
      const hours = (Date.now() - new Date(activePunch.clockIn).getTime()) / (1000 * 60 * 60);
      total += hours;
    }
    
    return total;
  };

  const displayHours = calculateTotalHours();

  // Check if work order is new (created within last 24 hours)
  const isNewWorkOrder = workOrder.createdAt 
    ? (new Date().getTime() - new Date(workOrder.createdAt).getTime()) < (24 * 60 * 60 * 1000)
    : false;

  return (
    <Card
      className={`
        relative overflow-hidden hover-elevate transition-all
        ${theme === 'dark' ? 'border-primary/20' : ''}
        ${theme === 'unicorn' ? 'border-primary/30' : ''}
        ${isNewWorkOrder ? 'new-work-order-glow' : ''}
      `}
      data-testid={`card-workorder-${workOrder.id}`}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: `url(${hexBg})`, backgroundSize: 'cover' }}
      />

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold" data-testid="text-wo-number">
            {workOrder.workOrderNumber}
          </CardTitle>
          <div className="flex gap-1.5">
            <Badge className={`${priorityColor} text-white text-xs`}>
              {workOrder.priority}
            </Badge>
            <Badge className={`${statusColor} text-white text-xs`}>
              {workOrder.status}
            </Badge>
          </div>
        </div>
        <h3 className={`
          text-base font-medium mt-1
          ${theme === 'light' || theme === 'unicorn' ? 'bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-foreground'}
        `}>
          {workOrder.title}
        </h3>
      </CardHeader>

      <CardContent className="relative z-10 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{workOrder.customer}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{workOrder.headquarters}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>{workOrder.asset}</span>
          </div>
        </div>

        {(workOrder.status === "completed" || workOrder.status === "closedForReview") && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hours Worked:</span>
              <span className="font-semibold">
                {displayHours.toFixed(1)}h / {totalBudgetedHours.toFixed(1)}h
              </span>
            </div>
            {workOrder.efficiency && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Efficiency:</span>
                <span className={`font-semibold ${efficiencyColor(workOrder.efficiency)}`}>
                  {workOrder.efficiency.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}

        {workOrder.status !== "completed" && workOrder.status !== "closedForReview" && tasks.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Task Hours:</p>
            {tasks.map((task, index) => {
              const taskPunches = punches.filter(p => p.taskId === task.id && p.punchType === "work");
              const taskHours = taskPunches.reduce((sum, punch) => {
                if (punch.clockOut) {
                  return sum + (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
                }
                return sum;
              }, 0);
              
              if (taskHours === 0) return null;
              
              return (
                <div key={task.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-1">{index + 1}. {task.title}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {taskHours.toFixed(1)}h
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {tasks.length > 0 && (
          <Collapsible open={showTasks} onOpenChange={setShowTasks} className="pt-2 border-t">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between"
                data-testid={`button-toggle-tasks-${workOrder.id}`}
              >
                <span className="text-sm font-medium">Tasks ({tasks.length})</span>
                {showTasks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {tasks.map((task, index) => {
                const taskPunches = punches.filter(p => p.taskId === task.id);
                const totalHours = taskPunches.reduce((sum, punch) => {
                  if (punch.clockOut) {
                    const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
                    return sum + hours;
                  }
                  return sum;
                }, 0);
                const canEdit = workOrder.status !== "completed" && workOrder.status !== "closedForReview";

                return (
                  <div key={task.id} className="bg-muted/50 rounded-md p-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{index + 1}. {task.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {task.budgetedHours}h budget
                        </Badge>
                        {totalHours > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {totalHours.toFixed(1)}h actual
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {taskPunches.length > 0 && (
                      <div className="space-y-1">
                        {taskPunches.map((punch) => (
                          <div
                            key={punch.id}
                            className="flex items-center justify-between text-xs bg-background/50 p-1.5 rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {new Date(punch.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {punch.clockOut && ` - ${new Date(punch.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {punch.clockOut && (
                                <Badge variant="outline" className="text-xs">
                                  {((new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                                </Badge>
                              )}
                              {canEdit && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditPunch(punch)}
                                  data-testid={`button-edit-punch-${punch.id}`}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="space-y-2 pt-2">
          {isAssignedToCurrentUser && workOrder.status !== "completed" && workOrder.status !== "closedForReview" && (
            <div className="flex gap-2">
              {!isPunchedIn ? (
                <Button
                  size="sm"
                  onClick={() => punchInMutation.mutate()}
                  disabled={punchInMutation.isPending || !!currentPunch}
                  className="flex-1"
                  data-testid={`button-punch-in-${workOrder.id}`}
                >
                  <PlayCircle className="mr-1 h-4 w-4" />
                  {punchInMutation.isPending ? "Punching in..." : "Punch In"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => punchOutMutation.mutate()}
                  disabled={punchOutMutation.isPending}
                  variant="outline"
                  className="flex-1"
                  data-testid={`button-punch-out-${workOrder.id}`}
                >
                  <PauseCircle className="mr-1 h-4 w-4" />
                  {punchOutMutation.isPending ? "Punching out..." : "Punch Out"}
                </Button>
              )}
            </div>
          )}
          
          {showAssignButtons && (
            !showAssign ? (
              <div className="flex gap-2">
                {assignedUser ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAssign(true)}
                    data-testid={`button-reassign-${workOrder.id}`}
                  >
                    Reassign ({assignedUser.username})
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAssign(true)}
                    data-testid={`button-assign-${workOrder.id}`}
                  >
                    Assign
                  </Button>
                )}
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => (window.location.href = `/work-orders/${workOrder.workOrderNumber}`)}
                  data-testid={`button-view-${workOrder.id}`}
                >
                  View Details
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
              <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUserSelect}
                    className="flex-1 justify-between"
                    disabled={assignMutation.isPending}
                    data-testid={`select-assign-${workOrder.id}`}
                  >
                    {selectedUserId
                      ? users?.find((user) => user.id === selectedUserId)?.username
                      : "Select user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." data-testid="input-search-users" />
                    <CommandList>
                      {isLoadingUsers ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading users...</div>
                      ) : !users || users.length === 0 ? (
                        <CommandEmpty>No users available.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.username}
                              onSelect={() => {
                                setSelectedUserId(user.id);
                                setTimeout(() => setOpenUserSelect(false), 0);
                              }}
                              data-testid={`user-option-${user.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {user.username}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedUserId) {
                    assignMutation.mutate(selectedUserId);
                  }
                }}
                disabled={assignMutation.isPending || !selectedUserId}
                data-testid={`button-confirm-assign-${workOrder.id}`}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAssign(false);
                  setSelectedUserId("");
                  setOpenUserSelect(false);
                }}
                disabled={assignMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          )
          )}
        </div>
        {/* Notes & Attachments Section */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Notes & Attachments</h4>
            {!isEditingNotes && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditingNotes(true)}
                data-testid={`button-edit-notes-${workOrder.id}`}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Photos Display */}
          {workOrder.photos && workOrder.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {workOrder.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border"
                  data-testid={`img-attachment-${index}`}
                />
              ))}
            </div>
          )}

          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Add notes or comments..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="min-h-20 text-sm"
                data-testid={`textarea-notes-${workOrder.id}`}
              />
              
              <div className="flex gap-1 flex-wrap">
                <label className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    disabled={uploadingPhoto}
                    asChild
                    data-testid={`button-upload-photo-${workOrder.id}`}
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
                    data-testid={`input-photo-${workOrder.id}`}
                  />
                </label>

                <Button
                  size="sm"
                  onClick={() => updateNotesMutation.mutate()}
                  disabled={updateNotesMutation.isPending}
                  className="h-7"
                  data-testid={`button-save-notes-${workOrder.id}`}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNotesText(workOrder.notes || "");
                  }}
                  className="h-7"
                  data-testid={`button-cancel-notes-${workOrder.id}`}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-1 min-h-6 whitespace-pre-wrap">
              {workOrder.notes || "No notes yet. Click edit to add notes or attach photos."}
            </p>
          )}
        </div>
      </CardContent>

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
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updatePunchMutation.isPending}
              data-testid="button-save-edit"
            >
              {updatePunchMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
