import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import elevexLogoUrl from "@assets/IMG_8549_1763925147777.jpeg";


export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const departments = [
    {
      titleKey: "nav_dashboard" as const,
      url: "/",
      icon: "fa-home",
      testId: "link-dashboard",
    },
    {
      titleKey: "nav_sales" as const,
      url: "/sales",
      icon: "fa-dollar-sign",
      testId: "link-sales",
    },
    {
      titleKey: "nav_rental" as const,
      url: "/rental",
      icon: "fa-truck",
      testId: "link-rental",
    },
    {
      titleKey: "nav_work_orders" as const,
      url: "/work-orders",
      icon: "fa-clipboard-list",
      testId: "link-work-orders",
    },
    {
      titleKey: "nav_appointments" as const,
      url: "/appointments",
      icon: "fa-calendar-check",
      testId: "link-appointments",
    },
    {
      titleKey: "nav_accounting" as const,
      url: "/accounting",
      icon: "fa-calculator",
      testId: "link-accounting",
    },
    {
      titleKey: "nav_warranty" as const,
      url: "/warranty",
      icon: "fa-shield-alt",
      testId: "link-warranty",
    },
    {
      titleKey: "nav_messages" as const,
      url: "/messages",
      icon: "fa-comments",
      testId: "link-messages",
    },
    {
      titleKey: "nav_parts" as const,
      url: "/parts",
      icon: "fa-boxes",
      testId: "link-parts",
    },
  ];

  const adminMenuItems = [
    {
      titleKey: "nav_create_user" as const,
      url: "/admin/create-user",
      icon: "fa-user-plus",
      testId: "link-create-user",
    },
  ];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 md:p-6 border-b border-sidebar-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
        <Link href="/">
          <div className="relative flex flex-col items-center gap-2 cursor-pointer hover-elevate rounded-lg p-3 -m-2 transition-all duration-300">
            <img
              src={elevexLogoUrl}
              alt="ELEVEX Logo"
              className="w-24 h-auto max-h-40 object-contain"
              data-testid="sidebar-logo"
            />
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 md:px-3 py-3 md:py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider mb-2 px-2 md:px-3">
            {t("nav_departments")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {departments.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url} 
                    data-testid={item.testId}
                    className="group relative overflow-hidden transition-all duration-300"
                  >
                    <Link href={item.url}>
                      {location === item.url && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                      )}
                      <div className="flex items-center gap-3 w-full relative z-10">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                          location === item.url 
                            ? 'bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/30' 
                            : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-gradient-to-br group-hover:from-cyan-500/80 group-hover:via-purple-500/80 group-hover:to-pink-500/80 group-hover:text-white'
                        }`}>
                          <i className={`fas ${item.icon} text-sm`}></i>
                        </div>
                        <span className={`font-medium transition-colors duration-300 ${
                          location === item.url ? 'text-primary' : ''
                        }`}>{t(item.titleKey)}</span>
                      </div>
                      {location === item.url && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 rounded-r-full"></div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider mb-2 px-3">
              {t("nav_admin")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url} 
                      data-testid={item.testId}
                      className="group relative overflow-hidden transition-all duration-300"
                    >
                      <Link href={item.url}>
                        {location === item.url && (
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                        )}
                        <div className="flex items-center gap-3 w-full relative z-10">
                          <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                            location === item.url 
                              ? 'bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-primary/30' 
                              : 'bg-sidebar-accent text-sidebar-accent-foreground group-hover:bg-gradient-to-br group-hover:from-cyan-500/80 group-hover:via-purple-500/80 group-hover:to-pink-500/80 group-hover:text-white'
                          }`}>
                            <i className={`fas ${item.icon} text-sm`}></i>
                          </div>
                          <span className={`font-medium transition-colors duration-300 ${
                            location === item.url ? 'text-primary' : ''
                          }`}>{t(item.titleKey)}</span>
                        </div>
                        {location === item.url && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 rounded-r-full"></div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}