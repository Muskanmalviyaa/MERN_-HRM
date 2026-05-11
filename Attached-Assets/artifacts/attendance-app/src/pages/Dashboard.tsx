import { useGetMe, useGetDashboardStats, useGetTodayAttendance } from "@workspace/api-client-react";
import { UserRole } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Calendar, AlertCircle, CheckCircle2, TrendingUp, Users, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: user, isLoading: loadingUser } = useGetMe();
  const isEmployee = user?.role === UserRole.employee;

  const { data: stats, isLoading: loadingStats } = useGetDashboardStats({
    query: { enabled: !isEmployee },
  });

  const { data: todayAttendance, isLoading: loadingToday } = useGetTodayAttendance({
    query: { enabled: true },
  });

  if (loadingUser) return <DashboardSkeleton />;

  if (isEmployee) {
    const record = todayAttendance?.record;
    const workingHours = record?.workingHours || 0;
    const progress = Math.min((workingHours / 8) * 100, 100);
    const isComplete = workingHours >= 8;
    const isPunchedIn = record && !record.punchOutTime;
    const isPunchedOut = record && record.punchOutTime;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Good {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Status</CardTitle>
              <div className={`w-2.5 h-2.5 rounded-full ${isPunchedIn ? "bg-green-500 animate-pulse" : isPunchedOut ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loadingToday ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {isPunchedOut ? "Completed" : isPunchedIn ? "Punched In" : "Not Started"}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                {record?.punchInTime
                  ? `In: ${format(new Date(record.punchInTime), "HH:mm")}${record.punchOutTime ? ` · Out: ${format(new Date(record.punchOutTime), "HH:mm")}` : ""}`
                  : "No punch record for today"}
              </p>
              {!record && (
                <Link href="/punch">
                  <Button size="sm" className="mt-3 h-7 text-xs">
                    Punch In Now
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">Working Hours</CardTitle>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loadingToday ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {workingHours.toFixed(1)}
                    <span className="text-base font-medium text-muted-foreground">h / 8.0h</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Progress
                      value={progress}
                      className="h-2"
                      indicatorClassName={isComplete ? "bg-green-500" : "bg-primary"}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isComplete ? "Full shift completed ✓" : `${(8 - workingHours).toFixed(1)}h remaining`}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="flex flex-wrap gap-3">
                <Link href="/punch">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1.5" /> Punch In/Out
                  </Button>
                </Link>
                <Link href="/attendance">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> My Attendance
                  </Button>
                </Link>
                <Link href="/overtime">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Request Overtime
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {loadingStats ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Records"
            value={stats?.totalDays || 0}
            icon={<Calendar className="w-4 h-4 text-blue-500" />}
            accent="blue"
          />
          <StatCard
            title="Completed"
            value={stats?.completedDays || 0}
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            accent="green"
          />
          <StatCard
            title="Incomplete"
            value={stats?.incompleteDays || 0}
            icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
            accent="amber"
          />
          <StatCard
            title="Avg Hours"
            value={(stats?.avgWorkingHours || 0).toFixed(1) + "h"}
            icon={<Clock className="w-4 h-4 text-purple-500" />}
            accent="purple"
          />
          <StatCard
            title="Pending OT"
            value={stats?.pendingOvertimeCount || 0}
            icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
            accent="orange"
          />
          <StatCard
            title="Pending Validation"
            value={stats?.pendingValidationCount || 0}
            icon={<Users className="w-4 h-4 text-red-500" />}
            accent="red"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/attendance">
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">View Attendance</Button>
              </Link>
              <Link href="/validation">
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">Review Selfies</Button>
              </Link>
              <Link href="/overtime">
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">Overtime Requests</Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">Daily Reports</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground mb-1">Today's Summary</p>
            <p className="text-xs text-muted-foreground mb-3">{format(new Date(), "MMMM d, yyyy")}</p>
            {loadingToday ? (
              <Skeleton className="h-10 w-full" />
            ) : todayAttendance?.record ? (
              <div className="text-sm text-foreground space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your punch in</span>
                  <span className="font-medium">{format(new Date(todayAttendance.record.punchInTime), "HH:mm")}</span>
                </div>
                {todayAttendance.record.punchOutTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your punch out</span>
                    <span className="font-medium">{format(new Date(todayAttendance.record.punchOutTime), "HH:mm")}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No personal record yet today</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          {icon}
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="border-border bg-card">
          <CardContent className="p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
