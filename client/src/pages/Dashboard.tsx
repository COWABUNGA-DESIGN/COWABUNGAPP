import { useAuth } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { TimeTrackingPanel } from "@/components/TimeTrackingPanel";
import { WeeklyHoursProgress } from "@/components/WeeklyHoursProgress";
import { WorkOrderCardNew } from "@/components/WorkOrderCardNew";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MoodSelector } from "@/components/MoodSelector";
import type { WorkOrder, TimePunch } from "@shared/schema";

interface UserStats {
  assignedWorkOrdersCount: number;
  completedWorkOrdersCount: number;
  avgEfficiency: number | null;
  hoursToday: number;
  hoursThisWeek: number;
  kmToday: number;
  kmThisWeek: number;
  kmOverall: number;
  allCompletedEfficiency: number | null;
  overtimeHours?: number;
}

export default function Dashboard() {
  const { data: user } = useAuth();
  const { theme } = useTheme();

  const { data: assignedWorkOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/assigned"],
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/users/stats"],
    refetchInterval: 5000, // Sync efficiency every 5 seconds
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

  // Get the active work order if user is punched in
  const activeWorkOrderId = activePunch?.workOrderId;
  const activeWorkOrder = assignedWorkOrders?.find(wo => wo.id === activeWorkOrderId);

  const efficiencyColor = (eff: number | null) => {
    if (!eff) return "text-muted-foreground";
    // Higher efficiency = better (>100% means under budget)
    if (eff >= 100) return "text-green-500"; // On budget or better
    if (eff >= 80) return "text-yellow-500"; // Slightly over budget
    return "text-red-500"; // Significantly over budget
  };

  return (
    <div className="space-y-8 py-2">
      {/* Banner Image */}
      {user?.bannerImage && (
        <div className="fade-in-up -mx-4 md:mx-0 md:rounded-xl overflow-hidden max-h-64 shadow-lg">
          <img 
            src={user.bannerImage} 
            alt="Profile banner" 
            className="w-full h-64 object-cover"
            data-testid="banner-image"
          />
        </div>
      )}

      <div className="w-full space-y-8 px-2 md:px-4">
        {/* Welcome Header */}
        <div className="fade-in-up space-y-3">
          <h1 className={`
            font-bold tracking-tight
            ${theme === 'dark' ? 'text-4xl text-primary' : ''}
            ${theme === 'light' ? 'text-5xl gradient-text' : ''}
            ${theme === 'unicorn' ? 'text-5xl gradient-text' : ''}
          `} data-testid="dashboard-title">
            {theme === 'dark' ? 'Dashboard' : 'Welcome Back'}
          </h1>
          <p className={`
            text-lg
            ${theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'}
          `}>
            {user?.username || 'Employee'}, here's your work overview
          </p>
        </div>

        {/* Mood Selector */}
        <div className="fade-in-up">
          <Card>
            <CardContent className="pt-6">
              <MoodSelector currentMood={user?.mood} />
            </CardContent>
          </Card>
        </div>

      {/* Time Tracking Panel - Main Feature */}
      <div className="fade-in-up">
        <TimeTrackingPanel />
      </div>

      {/* Active Work Order - When punched in */}
      {activeWorkOrder && activePunch?.punchType === "work" && (
        <div className="fade-in-up">
          <h2 className="font-bold text-2xl mb-4 text-foreground">
            Currently Working On
          </h2>
          <WorkOrderCardNew workOrder={activeWorkOrder} showPunchButtons={true} />
        </div>
      )}

      {/* Weekly Hours Progress & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 fade-in-up">
        {/* Weekly Progress Chart */}
        <div className="md:col-span-1">
          <WeeklyHoursProgress weeklyHours={stats?.hoursThisWeek || 0} isLoading={isLoading} />
        </div>

        {/* Overtime Stats - Shows when over 40h */}
        {stats && stats.hoursThisWeek >= 40 && (
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Overtime Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(stats.hoursThisWeek - 40).toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Beyond 40-hour target
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kilometers Stats */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Kilometers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold" data-testid="km-today">{(stats?.kmToday || 0).toFixed(1)}km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-lg font-semibold" data-testid="km-week">{(stats?.kmThisWeek || 0).toFixed(1)}km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall</p>
                <p className="text-sm" data-testid="km-overall">{(stats?.kmOverall || 0).toFixed(1)}km</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in-up">
        {/* Hours Today/Week */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Today:</span>
                <span className="text-lg font-bold" data-testid="hours-today">
                  {stats?.hoursToday?.toFixed(1) || 0}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Week:</span>
                <span className="text-lg font-bold" data-testid="hours-week">
                  {stats?.hoursThisWeek?.toFixed(1) || 0}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders Count */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Assigned:</span>
                <span className="text-lg font-bold" data-testid="assigned-count">
                  {stats?.assignedWorkOrdersCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Completed:</span>
                <span className="text-lg font-bold" data-testid="completed-count">
                  {stats?.completedWorkOrdersCount || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {user?.role === "technical_advisor" ? "Overall Efficiency" : "My Efficiency"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.role === "technical_advisor" && stats && stats.allCompletedEfficiency !== null ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">All Completed:</span>
                    <span className={`text-lg font-bold ${efficiencyColor(stats.allCompletedEfficiency)}`} data-testid="all-efficiency">
                      {stats.allCompletedEfficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={stats.allCompletedEfficiency} 
                      className="h-2"
                      data-testid="all-efficiency-bar"
                    />
                    {stats.allCompletedEfficiency > 100 && (
                      <span className="text-[10px] text-green-600 font-semibold absolute -top-4 right-0">
                        Over Target!
                      </span>
                    )}
                  </div>
                </div>
                {stats.avgEfficiency !== null && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">My Average:</span>
                      <span className={`text-lg font-bold ${efficiencyColor(stats.avgEfficiency)}`} data-testid="my-efficiency">
                        {stats.avgEfficiency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={stats.avgEfficiency} 
                        className="h-2"
                        data-testid="my-efficiency-bar"
                      />
                      {stats.avgEfficiency > 100 && (
                        <span className="text-[10px] text-green-600 font-semibold absolute -top-4 right-0">
                          Over Target!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : stats && stats.avgEfficiency !== null ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Average:</span>
                  <span className={`text-lg font-bold ${efficiencyColor(stats.avgEfficiency)}`} data-testid="my-efficiency">
                    {stats.avgEfficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={stats.avgEfficiency} 
                    className="h-2"
                    data-testid="my-efficiency-bar"
                  />
                  {stats.avgEfficiency > 100 && (
                    <span className="text-[10px] text-green-600 font-semibold absolute -top-4 right-0">
                      Over Target!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No completed work orders yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Work Orders */}
      <div className="space-y-4 fade-in-up">
        <h2 className={`
          font-semibold
          ${theme === 'dark' ? 'text-lg' : 'text-xl'}
        `}>
          Active Work Orders
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading work orders...</div>
        ) : !assignedWorkOrders || assignedWorkOrders.filter(wo => wo.status !== "completed" && wo.status !== "closedForReview").length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active work orders
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedWorkOrders
              .filter(wo => wo.status !== "completed" && wo.status !== "closedForReview")
              .map((wo) => (
                <WorkOrderCardNew key={wo.id} workOrder={wo} showPunchButtons={true} />
              ))}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}