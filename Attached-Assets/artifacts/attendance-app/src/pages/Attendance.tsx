import { useState } from "react";
import { useListAttendance, useGetMe, useGetAttendance, getGetAttendanceQueryKey } from "@workspace/api-client-react";
import { UserRole } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Info, X, Calendar } from "lucide-react";

export default function Attendance() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: user } = useGetMe();
  const isAdminOrManager = user?.role === UserRole.admin || user?.role === UserRole.manager;

  const { data, isLoading } = useListAttendance(
    { startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 20 },
    { query: { keepPreviousData: true } as any }
  );

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = startDate || endDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} total records` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="h-8 w-36 text-xs bg-background border-border"
            />
          </div>
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="h-8 w-36 text-xs bg-background border-border"
          />
          {hasFilters && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Date</TableHead>
                {isAdminOrManager && (
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employee</TableHead>
                )}
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">In</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Out</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hours</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validation</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    {isAdminOrManager && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdminOrManager ? 8 : 7} className="text-center py-12 text-muted-foreground text-sm">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-sm text-foreground">
                      {format(new Date(record.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    {isAdminOrManager && (
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">{record.user?.name}</span>
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-foreground font-mono">
                      {format(new Date(record.punchInTime), "HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-foreground font-mono">
                      {record.punchOutTime ? format(new Date(record.punchOutTime), "HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {record.workingHours ? record.workingHours.toFixed(1) + "h" : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          record.status === "completed"
                            ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs"
                            : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-xs"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          record.validationStatus === "valid"
                            ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs"
                            : record.validationStatus === "invalid"
                            ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs"
                            : "border-border text-muted-foreground bg-muted/50 text-xs"
                        }
                      >
                        {record.validationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AttendanceDetailsDialog attendanceId={record.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > 20 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceDetailsDialog({ attendanceId }: { attendanceId: number }) {
  const [open, setOpen] = useState(false);
  const { data: record, isLoading } = useGetAttendance(attendanceId, {
    query: { enabled: open, queryKey: getGetAttendanceQueryKey(attendanceId) },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Info className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Attendance Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : record ? (
          <div className="space-y-3 pt-2 text-sm">
            {[
              ["Record ID", `#${record.id}`],
              ["Employee", record.user?.name || "Unknown"],
              ["Punch In", format(new Date(record.punchInTime), "MMM dd, yyyy HH:mm:ss")],
              ["Punch Out", record.punchOutTime ? format(new Date(record.punchOutTime), "MMM dd, yyyy HH:mm:ss") : "Not yet"],
              ["Working Hours", record.workingHours ? `${record.workingHours.toFixed(2)}h` : "In progress"],
              ["Status", record.status],
              ["Validation", record.validationStatus],
              ...(record.remarks ? [["Remarks", record.remarks]] : []),
              ["GPS", `${record.latitude || "N/A"}, ${record.longitude || "N/A"}`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground shrink-0 w-28">{label}</span>
                <span className="text-foreground font-medium text-right break-all">{value}</span>
              </div>
            ))}
            {record.selfieUrl && (
              <div className="pt-2">
                <p className="text-muted-foreground mb-2">Selfie Photo</p>
                <div className="w-28 h-28 rounded-lg overflow-hidden border border-border">
                  <img src={record.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Record not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
