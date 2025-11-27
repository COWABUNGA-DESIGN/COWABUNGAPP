import { useTheme } from "@/contexts/ThemeContext";
import { TripleThemeToggle } from "@/components/TripleThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth, logout } from "@/lib/auth";
import elevexLogoUrl from "@assets/giphy-downsized-medium_1763918974192.gif";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Bell, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export function TopBar() {
  const { theme } = useTheme();
  const { data: user } = useAuth();

  const { data: notifications = [] } = useQuery<Array<{
    id: string;
    type: string;
    message: string;
    workOrderId: string | null;
    isRead: string;
    createdAt: string;
  }>>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => n.isRead === 'false').length;

  const handleMarkAsRead = async (notificationId: string) => {
    await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    await queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
  };

  const handleMarkAllAsRead = async () => {
    await apiRequest("PATCH", "/api/notifications/mark-all-read");
    await queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
  };

  return (
    <div className={`
      sticky top-0 z-50 border-b backdrop-blur-md shadow-sm
      ${theme === 'dark' ? 'bg-background/95 border-primary/20' : ''}
      ${theme === 'light' ? 'bg-background/80 border-border' : ''}
      ${theme === 'unicorn' ? 'bg-gradient-to-r from-cyan-50 via-purple-50 to-pink-50 border-primary/30' : ''}
    `} data-testid="topbar">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 max-w-[1600px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src={elevexLogoUrl}
            alt="ELEVEX"
            className="h-36 w-auto object-contain"
            data-testid="topbar-logo"
          />
        </div>

        {/* Right side - Theme toggle, notifications, and user */}
        <div className="flex items-center gap-3">
          <TripleThemeToggle />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative hover-elevate rounded-full p-2" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
                      data-testid="badge-notification-count"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary hover:underline"
                      data-testid="button-mark-all-read"
                    >
                      Mark all as read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                          notification.isRead === 'false' ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => notification.isRead === 'false' && handleMarkAsRead(notification.id)}
                        data-testid={`notification-${notification.id}`}
                      >
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {notification.isRead === 'false' && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover-elevate rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={`
                      font-semibold
                      ${theme === 'dark' ? 'bg-primary/20 text-primary' : ''}
                      ${theme === 'light' ? 'bg-primary/10 text-primary' : ''}
                      ${theme === 'unicorn' ? 'bg-gradient-to-br from-cyan-400 to-pink-400 text-white' : ''}
                    `}>
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild data-testid="button-settings">
                  <Link href="/settings" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}