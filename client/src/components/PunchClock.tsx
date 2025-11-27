import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Power } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimePunch } from "@shared/schema";

interface TimeStatus {
  isClockedIn: boolean;
  currentPunch: TimePunch | null;
}

interface PunchResponse {
  action: "clock-in" | "clock-out";
  punch: TimePunch;
}

export function PunchClock() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  // Get current punch status
  const { data: status } = useQuery<TimeStatus>({
    queryKey: ["/api/time/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isClockedIn = status?.isClockedIn || false;
  const currentPunch = status?.currentPunch;

  // Calculate elapsed time
  useEffect(() => {
    if (!isClockedIn || !currentPunch?.clockIn) {
      setElapsedTime("00:00:00");
      return;
    }

    const updateElapsed = () => {
      const start = new Date(currentPunch.clockIn).getTime();
      const now = Date.now();
      const diff = now - start;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [isClockedIn, currentPunch]);

  // Punch mutation
  const punchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/time/punch", {});
      return await res.json() as PunchResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/time/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time/hours"] });
      
      toast({
        title: data.action === "clock-in" ? "Clocked In ✓" : "Clocked Out ✓",
        description: data.action === "clock-in" 
          ? "Your shift has started" 
          : "Your shift has ended",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to punch. Please try again.",
      });
    },
  });

  return (
    <Card className={`
      ${theme === 'dark' ? 'bg-card border-primary/20' : ''}
      ${theme === 'light' ? 'shadow-md' : ''}
      ${theme === 'unicorn' ? 'bg-gradient-to-br from-white to-pink-50 border-pink-200' : ''}
    `} data-testid="punch-clock-card">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className={`
              h-3 w-3 rounded-full animate-pulse
              ${isClockedIn ? 'bg-green-500' : 'bg-red-500'}
            `} data-testid="status-indicator" />
            <span className={`
              ${theme === 'dark' ? 'text-sm' : 'text-base'}
              font-medium text-muted-foreground
            `}>
              {isClockedIn ? "Clocked In" : "Clocked Out"}
            </span>
          </div>

          {/* Elapsed time (only show when clocked in) */}
          {isClockedIn && (
            <div className="text-center">
              <p className={`
                ${theme === 'dark' ? 'text-xs' : 'text-sm'}
                text-muted-foreground mb-2
              `}>
                Elapsed Time
              </p>
              <p className={`
                ${theme === 'dark' ? 'text-2xl' : 'text-4xl'}
                font-bold
                ${theme === 'unicorn' ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent' : 'text-foreground'}
              `} data-testid="elapsed-time">
                {elapsedTime}
              </p>
            </div>
          )}

          {/* Punch button */}
          <Button
            onClick={() => punchMutation.mutate()}
            disabled={punchMutation.isPending}
            size={theme === 'dark' ? "default" : "lg"}
            className={`
              w-full
              ${theme === 'dark' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
              ${theme === 'light' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600' : ''}
              ${theme === 'unicorn' ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' : ''}
            `}
            data-testid="punch-button"
          >
            <Power className={`
              ${theme === 'dark' ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'}
            `} />
            {isClockedIn ? "Clock Out" : "Clock In"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
