import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";

interface HoursData {
  today: number;
  week: number;
}

export function HoursStats() {
  const { theme } = useTheme();

  const { data: hours } = useQuery<HoursData>({
    queryKey: ["/api/time/hours"],
    refetchInterval: 60000, // Refresh every minute
  });

  const todayHours = hours?.today || 0;
  const weekHours = hours?.week || 0;

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Today's Hours */}
      <Card className={`
        ${theme === 'dark' ? 'bg-card border-primary/20' : ''}
        ${theme === 'light' ? 'shadow-md' : ''}
        ${theme === 'unicorn' ? 'bg-gradient-to-br from-cyan-50 to-purple-50 border-cyan-200' : ''}
      `} data-testid="hours-today-card">
        <CardHeader className="pb-3">
          <CardTitle className={`
            flex items-center gap-2
            ${theme === 'dark' ? 'text-sm' : 'text-base'}
          `}>
            <Clock className={`
              ${theme === 'dark' ? 'h-4 w-4' : 'h-5 w-5'}
              ${theme === 'unicorn' ? 'text-cyan-500' : 'text-primary'}
            `} />
            <span>Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`
            ${theme === 'dark' ? 'text-xl' : 'text-3xl'}
            font-bold
            ${theme === 'unicorn' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent' : 'text-foreground'}
          `} data-testid="hours-today">
            {formatHours(todayHours)}
          </p>
        </CardContent>
      </Card>

      {/* Week's Hours */}
      <Card className={`
        ${theme === 'dark' ? 'bg-card border-primary/20' : ''}
        ${theme === 'light' ? 'shadow-md' : ''}
        ${theme === 'unicorn' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' : ''}
      `} data-testid="hours-week-card">
        <CardHeader className="pb-3">
          <CardTitle className={`
            flex items-center gap-2
            ${theme === 'dark' ? 'text-sm' : 'text-base'}
          `}>
            <Calendar className={`
              ${theme === 'dark' ? 'h-4 w-4' : 'h-5 w-5'}
              ${theme === 'unicorn' ? 'text-purple-500' : 'text-primary'}
            `} />
            <span>This Week</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`
            ${theme === 'dark' ? 'text-xl' : 'text-3xl'}
            font-bold
            ${theme === 'unicorn' ? 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent' : 'text-foreground'}
          `} data-testid="hours-week">
            {formatHours(weekHours)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
