import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Home, ClipboardList, MessageSquare, User, LogOut, Settings, Menu, Grid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";

const navItems = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "Orders", icon: ClipboardList, path: "/work-orders" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
];

const allPages = [
  { title: "Dashboard", path: "/", category: "Main" },
  { title: "Work Orders", path: "/work-orders", category: "Operations" },
  { title: "Equipment & Parts", path: "/machines", category: "Operations" },
  { title: "Appointments", path: "/appointments", category: "Operations" },
  { title: "Sales", path: "/sales", category: "Business" },
  { title: "Rental", path: "/rental", category: "Business" },
  { title: "Accounting", path: "/accounting", category: "Business" },
  { title: "Warranty Claims", path: "/warranty", category: "Business" },
  { title: "Messages", path: "/messages", category: "Communication" },
];

const adminPages = [
  { title: "Admin Panel", path: "/admin", category: "Admin" },
  { title: "Create User", path: "/admin/create-user", category: "Admin" },
];

const advisorPages = [
  { title: "Review Demands", path: "/advisor/demands", category: "Admin" },
  { title: "Create Work Order", path: "/work-orders/create", category: "Admin" },
];

export function BottomNavBar() {
  const [location, setLocation] = useLocation();
  const { theme } = useTheme();
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = useAuth();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  const handleNavigate = (path: string) => {
    setLocation(path);
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const getPagesByCategory = (category: string) => {
    let pages = allPages.filter(p => p.category === category);
    if (category === "Admin") {
      if (user?.role === "admin") {
        pages.push(...adminPages.filter(p => p.category === "Admin"));
      } else if (user?.role === "technical_advisor") {
        pages.push(...advisorPages.filter(p => p.category === "Admin"));
      }
    }
    return pages;
  };

  return (
    <>
      <div className={`
        fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md shadow-2xl md:hidden
        ${theme === 'dark' ? 'bg-background/95 border-primary/20' : ''}
        ${theme === 'light' ? 'bg-white/95 border-border' : ''}
        ${theme === 'unicorn' ? 'bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 border-primary/30' : ''}
      `} data-testid="bottom-nav">
        <nav className="flex items-center justify-around px-3 py-3 safe-area-inset-bottom">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]
                  ${theme === 'dark' && isActive ? 'bg-primary/20 text-primary' : ''}
                  ${theme === 'dark' && !isActive ? 'text-muted-foreground hover-elevate' : ''}
                  ${theme === 'light' && isActive ? 'bg-primary/10 text-primary' : ''}
                  ${theme === 'light' && !isActive ? 'text-muted-foreground hover-elevate' : ''}
                  ${theme === 'unicorn' && isActive ? 'bg-gradient-to-br from-cyan-400 to-pink-400 text-white' : ''}
                  ${theme === 'unicorn' && !isActive ? 'text-purple-600 hover-elevate' : ''}
                `}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Menu button - All Pages */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`
              flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]
              ${theme === 'dark' ? 'text-muted-foreground hover-elevate' : ''}
              ${theme === 'light' ? 'text-muted-foreground hover-elevate' : ''}
              ${theme === 'unicorn' ? 'text-purple-600 hover-elevate' : ''}
            `}
            data-testid="nav-menu"
          >
            <Grid className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs font-medium">
              Menu
            </span>
          </button>

          {/* Account button */}
          <button
            onClick={() => setAccountOpen(true)}
            className={`
              flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]
              ${theme === 'dark' ? 'text-muted-foreground hover-elevate' : ''}
              ${theme === 'light' ? 'text-muted-foreground hover-elevate' : ''}
              ${theme === 'unicorn' ? 'text-purple-600 hover-elevate' : ''}
            `}
            data-testid="nav-account"
          >
            <User className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs font-medium">
              Account
            </span>
          </button>
        </nav>
      </div>

      {/* Full Menu Drawer - All Pages */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>All Pages</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {["Main", "Operations", "Business", "Communication", "Admin"].map((category) => {
              const pages = getPagesByCategory(category);
              if (pages.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {pages.map((page) => {
                      const isActive = location === page.path;
                      return (
                        <Button
                          key={page.path}
                          variant={isActive ? "default" : "outline"}
                          className="justify-start h-auto py-3"
                          onClick={() => handleNavigate(page.path)}
                          data-testid={`menu-${page.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className="text-left">{page.title}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Account Menu Drawer */}
      <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
        <SheetContent side="right" className="w-[280px]">
          <SheetHeader>
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user?.username}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Settings */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleNavigate("/settings")}
              data-testid="button-profile-settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </Button>

            <Separator />

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive/10"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}