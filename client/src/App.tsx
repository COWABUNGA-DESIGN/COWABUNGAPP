import * as React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopBar } from "@/components/TopBar";
import { BottomNavBar } from "@/components/BottomNavBar";
import { useAuth } from "@/lib/auth";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import bgDarkUrl from "@assets/IMG_0730_1763452702046.jpeg";
import bgLightUrl from "@assets/IMG_0723_1763452702046.jpeg.jpeg";
import bgUnicornUrl from "@assets/IMG_0733_1763453430197.jpeg";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import WorkOrders from "@/pages/WorkOrders";
import WorkOrderDetail from "@/pages/WorkOrderDetail";
import Appointments from "@/pages/Appointments";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Sales from "@/pages/Sales";
import Rental from "@/pages/Rental";
import Accounting from "@/pages/Accounting";
import Warranty from "@/pages/Warranty";
import CreateUser from "@/pages/CreateUser";
import Admin from "@/pages/Admin";
import AdvisorDashboard from "@/pages/AdvisorDashboard";
import CreateWorkOrder from "@/pages/CreateWorkOrder";
import Machines from "@/pages/Machines";
import Parts from "@/pages/Parts";
import NotFound from "@/pages/not-found";

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const backgroundUrl = theme === "dark" ? bgDarkUrl : theme === "light" ? bgLightUrl : bgUnicornUrl;
  
  return (
    <div className="relative isolate flex flex-col h-screen w-full">
      <div 
        className="fixed inset-0 bg-center bg-no-repeat md:bg-cover"
        style={{ 
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: isMobile ? "200%" : "cover",
          backgroundPosition: "center center",
          imageRendering: "high-quality",
          zIndex: 0,
        }}
      />
      <div 
        className="fixed inset-0"
        style={{
          background: theme === "dark" ? "rgba(0,0,0,0.5)" : theme === "light" ? "rgba(255,255,255,0.4)" : "rgba(255,144,187,0.25)",
          zIndex: 1,
        }}
      />
      <div className="relative flex flex-col h-screen w-full" style={{ zIndex: 10 }}>
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </div>
  );
}

function ProtectedRouteWithLayout({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <ProtectedContent>
      <Component />
    </ProtectedContent>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRouteWithLayout component={Dashboard} />}
      </Route>
      <Route path="/sales">
        {() => <ProtectedRouteWithLayout component={Sales} />}
      </Route>
      <Route path="/rental">
        {() => <ProtectedRouteWithLayout component={Rental} />}
      </Route>
      <Route path="/work-orders">
        {() => <ProtectedRouteWithLayout component={WorkOrders} />}
      </Route>
      <Route path="/work-orders/:workOrderNumber">
        {() => <ProtectedRouteWithLayout component={WorkOrderDetail} />}
      </Route>
      <Route path="/machines">
        {() => <ProtectedRouteWithLayout component={Machines} />}
      </Route>
      <Route path="/parts">
        {() => <ProtectedRouteWithLayout component={Parts} />}
      </Route>
      <Route path="/appointments">
        {() => <ProtectedRouteWithLayout component={Appointments} />}
      </Route>
      <Route path="/accounting">
        {() => <ProtectedRouteWithLayout component={Accounting} />}
      </Route>
      <Route path="/warranty">
        {() => <ProtectedRouteWithLayout component={Warranty} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRouteWithLayout component={Messages} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRouteWithLayout component={Settings} />}
      </Route>
      <Route path="/admin/create-user">
        {() => <ProtectedRouteWithLayout component={CreateUser} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRouteWithLayout component={Admin} />}
      </Route>
      <Route path="/advisor/demands">
        {() => <ProtectedRouteWithLayout component={AdvisorDashboard} />}
      </Route>
      <Route path="/work-orders/create">
        {() => <ProtectedRouteWithLayout component={CreateWorkOrder} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { theme } = useTheme();
  
  React.useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
