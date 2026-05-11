import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useGetMe, useSyncMe, useHealthCheck } from "@workspace/api-client-react";
import { UserRole } from "@workspace/api-client-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  History,
  CheckCircle,
  BarChart,
  Users,
  LogOut,
  Fingerprint,
  Activity,
  Sun,
  Moon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { Badge } from "@/components/ui/badge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: clerkUser } = useUser();
  const syncMe = useSyncMe();
  const { data: userProfile } = useGetMe({ query: { enabled: !!clerkUser?.id } });
  const { data: health } = useHealthCheck();
  const { signOut } = useClerk();
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (clerkUser) {
      syncMe.mutate({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: clerkUser.fullName || clerkUser.username || "",
          avatarUrl: clerkUser.imageUrl,
        },
      });
    }
  }, [clerkUser?.id]);

  const role = userProfile?.role || UserRole.employee;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["employee", "manager", "admin"] },
    { icon: Clock, label: "Punch In/Out", path: "/punch", roles: ["employee", "manager", "admin"] },
    { icon: History, label: "Attendance", path: "/attendance", roles: ["employee", "manager", "admin"] },
    { icon: CalendarDays, label: "Overtime", path: "/overtime", roles: ["employee", "manager", "admin"] },
    { icon: CheckCircle, label: "Validation", path: "/validation", roles: ["manager", "admin"] },
    { icon: BarChart, label: "Reports", path: "/reports", roles: ["manager", "admin"] },
    { icon: Users, label: "Users", path: "/admin/users", roles: ["admin"] },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  const roleBadgeColor =
    role === "admin"
      ? "bg-red-500/20 text-red-300 border-red-500/30"
      : role === "manager"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-blue-500/20 text-blue-300 border-blue-500/30";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sidebar-foreground font-bold text-base tracking-tight">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-primary-foreground" />
                </div>
                <span>Attendance Core</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleTheme}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      >
                        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-2 h-2 rounded-full mt-0.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            health?.status === "ok" ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>API: {health?.status || "checking…"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] font-semibold tracking-widest px-2 mb-1">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = location === item.path || location.startsWith(item.path + "/");
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="h-9 px-2 rounded-md"
                        >
                          <Link href={item.path} className="flex items-center gap-2.5">
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto border-t border-sidebar-border p-3">
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <Avatar className="w-8 h-8 border border-sidebar-border shrink-0">
                <AvatarImage src={clerkUser?.imageUrl} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-bold">
                  {clerkUser?.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-sidebar-foreground truncate">
                  {clerkUser?.fullName || clerkUser?.username}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border w-fit capitalize mt-0.5 ${roleBadgeColor}`}>
                  {role}
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors rounded-md hover:bg-sidebar-accent"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col bg-background overflow-hidden">
          <main className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
