import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Play, Square, Navigation, Briefcase, ListTodo, Coffee } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimePunch, WorkOrder } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TimeTrackingPanel() {
  const { data: user } = useAuth();
  const { toast } = useToast();
  const [activeType, setActiveType] = useState<"work" | "travel" | "other" | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [showKmDialog, setShowKmDialog] = useState(false);
  const [kmValue, setKmValue] = useState("0");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [editingPunchId, setEditingPunchId] = useState<string | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editKm, setEditKm] = useState("0");
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState("30");

  const today = new Date().toISOString().split("T")[0];

  const { data: workOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: todayPunches } = useQuery<TimePunch[]>({
    queryKey: [`/api/time-punches/${user?.id}/${today}`],
    enabled: !!user,
  });

  const { data: activePunch } = useQuery<TimePunch | null>({
    queryKey: ["/api/active-punch"],
    enabled: !!user,
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await fetch("/api/active-punch", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active punch");
      return res.json();
    },
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { punchType: "work" | "travel" | "other"; workOrderId?: string }) => {
      const res = await apiRequest("POST", "/api/time-punches/clock-in", {
        punchType: data.punchType,
        workOrderId: data.workOrderId || null,
        clockInTime: new Date().toISOString(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to punch in");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/active-punch"] });
      queryClient.invalidateQueries({ queryKey: [`/api/time-punches/${user?.id}/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"], exact: false });
      setActiveType(null);
      setSelectedWorkOrderId("");
      toast({ title: "Punch started" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setActiveType(null);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (data: { kilometers?: number }) => {
      const res = await apiRequest("POST", "/api/time-punches/clock-out", {
        kilometers: data.kilometers || 0,
        clockOutTime: new Date().toISOString(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to punch out");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/active-punch"] });
      queryClient.invalidateQueries({ queryKey: [`/api/time-punches/${user?.id}/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/assigned"], exact: false });
      setShowKmDialog(false);
      setKmValue("0");
      setElapsedSeconds(0);
      toast({ title: "Punch stopped" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updatePunchMutation = useMutation({
    mutationFn: async (data: { punchId: string; clockIn: string; clockOut: string; kilometers?: number }) => {
      const clockInDate = new Date(data.clockIn + ":00");
      const clockOutDate = new Date(data.clockOut + ":00");
      
      const res = await apiRequest("PATCH", `/api/time-punches/${data.punchId}`, {
        clockIn: clockInDate.toISOString(),
        clockOut: clockOutDate.toISOString(),
        kilometers: data.kilometers || 0,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update punch");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/time-punches/${user?.id}/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/active-punch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches"], exact: false });
      setEditingPunchId(null);
      setEditClockIn("");
      setEditClockOut("");
      setEditKm("0");
      toast({ title: "Punch updated successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deletePunchMutation = useMutation({
    mutationFn: async (punchId: string) => {
      const res = await apiRequest("DELETE", `/api/time-punches/${punchId}`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete punch");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/time-punches/${user?.id}/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/active-punch"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches"], exact: false });
      toast({ title: "Punch deleted" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const breakMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const res = await apiRequest("POST", "/api/add-break", { breakMinutes: minutes });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add break");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      queryClient.invalidateQueries({ queryKey: [`/api/time-punches/${user?.id}/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-punches"], exact: false });
      setShowBreakDialog(false);
      setBreakMinutes("30");
      toast({ title: "Break recorded", description: "Break time removed from total hours" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleStartWork = () => {
    setActiveType("work");
  };

  const handleStartTravel = () => {
    setActiveType("travel");
  };

  const handleStartOther = () => {
    setActiveType("other");
  };

  const handleStartWorkOrder = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    clockInMutation.mutate({ punchType: "work", workOrderId });
  };

  const handleStop = () => {
    if (activePunch?.punchType === "travel") {
      setShowKmDialog(true);
    } else {
      clockOutMutation.mutate({});
    }
  };

  const handleConfirmKm = () => {
    const km = parseFloat(kmValue) || 0;
    clockOutMutation.mutate({ kilometers: km });
  };

  const confirmStartPunch = (type: "work" | "travel" | "other") => {
    if (type === "work") {
      clockInMutation.mutate({ punchType: "work" });
    } else {
      clockInMutation.mutate({ punchType: type });
    }
    setActiveType(null);
  };

  // Update elapsed seconds every second
  const [realElapsedSeconds, setRealElapsedSeconds] = useState(0);
  
  useEffect(() => {
    if (!activePunch?.clockIn) {
      setRealElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const clockInTime = new Date(activePunch.clockIn).getTime();
      const seconds = Math.floor((now - clockInTime) / 1000);
      setRealElapsedSeconds(seconds);
    }, 100); // Update 10 times per second for smooth display

    return () => clearInterval(timer);
  }, [activePunch?.clockIn]);

  // Format elapsed time as HH:MM:SS
  const hours = Math.floor(realElapsedSeconds / 3600);
  const minutes = Math.floor((realElapsedSeconds % 3600) / 60);
  const seconds = realElapsedSeconds % 60;
  const displayTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const workOrderOptions = workOrders?.filter(wo => wo.status !== "completed") || [];

  return (
    <Card data-testid="time-tracking-panel" className="shadow-lg">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Active Punch Display */}
        {activePunch && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  {activePunch.punchType === "work" && <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-300" />}
                  {activePunch.punchType === "travel" && <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-300" />}
                  {activePunch.punchType === "other" && <ListTodo className="h-4 w-4 text-blue-600 dark:text-blue-300" />}
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wide">
                    {activePunch.punchType === "work" ? "Working" : activePunch.punchType === "travel" ? "Traveling" : "Other Task"}
                  </p>
                </div>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 font-mono">{displayTime}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowBreakDialog(true)}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                  disabled={breakMutation.isPending}
                  data-testid="button-take-break"
                  title="Take a break (time will be removed from total hours)"
                >
                  <Coffee className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  disabled={clockOutMutation.isPending}
                  data-testid="button-stop-punch"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Start Buttons */}
        {!activePunch && (
          <div className="space-y-4">
            {/* Punch Work Button */}
            {activeType === "work" && (
              <div className="p-5 bg-amber-50 dark:bg-amber-950 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-md">
                <p className="text-base font-semibold text-foreground mb-4">Start Work Punch?</p>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    onClick={() => confirmStartPunch("work")}
                    disabled={clockInMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    data-testid="button-confirm-work"
                  >
                    Confirm
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setActiveType(null)}
                    data-testid="button-cancel-work"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Punch Work Order Button */}
            {activeType === "work" ? null : (
              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={handleStartWork}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-3 shadow-lg text-base font-semibold py-6"
                  disabled={!!activePunch}
                  data-testid="button-punch-work"
                >
                  <Play className="h-5 w-5" />
                  Start Work
                </Button>

                {/* Work Order Selector */}
                {workOrderOptions.length > 0 && !activePunch && (
                  <div className="p-4 bg-muted rounded-xl border border-border">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Or select a work order:</p>
                    <Select value={selectedWorkOrderId} onValueChange={handleStartWorkOrder}>
                      <SelectTrigger className="h-10" data-testid="select-workorder-punch">
                        <SelectValue placeholder="Select work order..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workOrderOptions.map(wo => (
                          <SelectItem key={wo.id} value={wo.id}>
                            {wo.workOrderNumber} - {wo.customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Punch Travel Button */}
            {activeType === "travel" && (
              <div className="p-5 bg-amber-50 dark:bg-amber-950 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-md">
                <p className="text-base font-semibold text-foreground mb-4">Start Travel Punch?</p>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    onClick={() => confirmStartPunch("travel")}
                    disabled={clockInMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    data-testid="button-confirm-travel"
                  >
                    Confirm
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setActiveType(null)}
                    data-testid="button-cancel-travel"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeType !== "travel" && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleStartTravel}
                className="w-full flex items-center justify-center gap-3"
                disabled={!!activePunch}
                data-testid="button-punch-travel"
              >
                <Navigation className="h-4 w-4" />
                Punch Travel
              </Button>
            )}

            {/* Punch Other Button */}
            {activeType === "other" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-foreground mb-2">Start Other Task?</p>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    onClick={() => confirmStartPunch("other")}
                    disabled={clockInMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-confirm-other"
                  >
                    Confirm
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setActiveType(null)}
                    data-testid="button-cancel-other"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeType !== "other" && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleStartOther}
                className="w-full flex items-center justify-center gap-3"
                disabled={!!activePunch}
                data-testid="button-punch-other"
              >
                <Briefcase className="h-4 w-4" />
                Punch Other Task
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Break Dialog */}
      <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take a Break</DialogTitle>
            <DialogDescription>How long is your break? (in minutes)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Break Duration (minutes)</Label>
              <Input
                type="number"
                min="1"
                max="480"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                placeholder="30"
                data-testid="input-break-minutes"
              />
              <p className="text-xs text-muted-foreground">
                This time will be subtracted from your total work hours
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBreakDialog(false);
                setBreakMinutes("30");
              }}
              data-testid="button-cancel-break"
            >
              Cancel
            </Button>
            <Button
              onClick={() => breakMutation.mutate(parseInt(breakMinutes) || 30)}
              disabled={breakMutation.isPending}
              data-testid="button-confirm-break"
            >
              {breakMutation.isPending ? "Recording..." : "Record Break"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KM Input Dialog for Travel */}
      <Dialog open={showKmDialog} onOpenChange={setShowKmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Travel Distance</DialogTitle>
            <DialogDescription>Enter kilometers traveled</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kilometers</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={kmValue}
                onChange={(e) => setKmValue(e.target.value)}
                placeholder="0"
                data-testid="input-travel-km"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowKmDialog(false);
                setKmValue("0");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmKm}
              disabled={clockOutMutation.isPending}
              data-testid="button-confirm-km"
            >
              {clockOutMutation.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Today's Punches Section */}
      {todayPunches && todayPunches.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold mb-3">Today's Punches</h3>
          <div className="space-y-2">
            {todayPunches.map((punch) => (
              <div
                key={punch.id}
                className="flex items-center justify-between p-2 bg-muted rounded-xl text-sm"
                data-testid={`punch-item-${punch.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {punch.punchType === "work"
                      ? "Work"
                      : punch.punchType === "travel"
                      ? "Travel"
                      : "Other"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {punch.clockIn
                      ? new Date(punch.clockIn).toLocaleTimeString()
                      : "No start"}
                    {punch.clockOut
                      ? ` - ${new Date(punch.clockOut).toLocaleTimeString()}`
                      : " (ongoing)"}
                  </p>
                  {punch.kilometers ? (
                    <p className="text-xs text-muted-foreground">
                      {punch.kilometers}km
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => {
                      setEditingPunchId(punch.id);
                      setEditClockIn(
                        new Date(punch.clockIn).toISOString().slice(0, 16)
                      );
                      setEditClockOut(
                        punch.clockOut
                          ? new Date(punch.clockOut).toISOString().slice(0, 16)
                          : ""
                      );
                      setEditKm((punch.kilometers || 0).toString());
                    }}
                    data-testid={`button-edit-punch-${punch.id}`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => deletePunchMutation.mutate(punch.id)}
                    disabled={deletePunchMutation.isPending}
                    data-testid={`button-delete-punch-${punch.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Punch Dialog */}
      <Dialog open={!!editingPunchId} onOpenChange={(open) => !open && setEditingPunchId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Punch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Clock In</Label>
              <Input
                type="datetime-local"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
                data-testid="input-edit-clockin"
              />
            </div>
            <div className="space-y-2">
              <Label>Clock Out</Label>
              <Input
                type="datetime-local"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
                data-testid="input-edit-clockout"
              />
            </div>
            <div className="space-y-2">
              <Label>Kilometers (if travel)</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={editKm}
                onChange={(e) => setEditKm(e.target.value)}
                data-testid="input-edit-km"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPunchId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editingPunchId || !editClockIn || !editClockOut) {
                  toast({ variant: "destructive", title: "Error", description: "Please fill in all fields" });
                  return;
                }
                updatePunchMutation.mutate({
                  punchId: editingPunchId,
                  clockIn: editClockIn,
                  clockOut: editClockOut,
                  kilometers: parseFloat(editKm) || 0,
                });
              }}
              disabled={updatePunchMutation.isPending}
              data-testid="button-save-punch-edit"
            >
              {updatePunchMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
