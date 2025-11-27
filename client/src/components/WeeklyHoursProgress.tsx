import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface WeeklyHoursProgressProps {
  weeklyHours: number;
  isLoading?: boolean;
}

export function WeeklyHoursProgress({ weeklyHours, isLoading = false }: WeeklyHoursProgressProps) {
  const [displayHours, setDisplayHours] = useState(weeklyHours);
  
  useEffect(() => {
    setDisplayHours(weeklyHours);
  }, [weeklyHours]);

  const TARGET_HOURS = 40;
  const isOvertime = displayHours >= TARGET_HOURS;
  const overtimeHours = isOvertime ? displayHours - TARGET_HOURS : 0;
  const progressPercentage = isOvertime ? 100 : (displayHours / TARGET_HOURS) * 100;
  
  // Colors for normal vs overtime
  const circleColor = isOvertime ? "#a855f7" : "#06b6d4"; // purple for overtime, cyan for normal
  const backgroundColor = isOvertime ? "rgba(168, 85, 247, 0.1)" : "rgba(6, 182, 212, 0.1)"; // very subtle bg

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <Card data-testid="weekly-hours-progress">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Weekly Progress {isOvertime && <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">OVERTIME</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Circular Progress */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="transform -rotate-90"
              data-testid="hours-progress-circle"
            >
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted-foreground/20"
              />
              {/* Progress circle */}
              <circle
                cx="70"
                cy="70"
                r="45"
                fill="none"
                stroke={circleColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            {/* Center text */}
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold" data-testid="hours-display">
                {displayHours.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">of {TARGET_HOURS}h</span>
              {isOvertime && (
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
                  +{overtimeHours.toFixed(1)}h OT
                </span>
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-1">
            {!isLoading && (
              <>
                {isOvertime ? (
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Overtime Mode Active
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {displayHours < TARGET_HOURS ? (
                      <>
                        {(TARGET_HOURS - displayHours).toFixed(1)}h until target
                      </>
                    ) : (
                      <>Target reached!</>
                    )}
                  </p>
                )}
              </>
            )}
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
