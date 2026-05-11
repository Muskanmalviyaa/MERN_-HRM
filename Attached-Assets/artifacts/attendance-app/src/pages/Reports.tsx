import { useState } from "react";
import { useGetDailyReport } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Download, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: report, isLoading } = useGetDailyReport(
    { date },
    { query: { keepPreviousData: true } as any }
  );

  const handleExportCSV = () => {
    if (!report?.records?.length) return;
    const headers = ["Employee", "Email", "Punch In", "Punch Out", "Hours", "Status", "Validation"];
    const rows = report.records.map((r) => [
      r.user?.name || "",
      r.user?.email || "",
      format(new Date(r.punchInTime), "HH:mm"),
      r.punchOutTime ? format(new Date(r.punchOutTime), "HH:mm") : "",
      r.workingHours ? r.workingHours.toFixed(2) : "",
      r.status,
      r.validationStatus,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedCount = report?.records?.filter((r) => r.status === "completed").length || 0;
  const pendingValidation = report?.records?.filter((r) => r.validationStatus === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organization-wide attendance for the selected date</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 w-40 text-xs bg-background border-border text-foreground"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleExportCSV}
            disabled={!report?.records?.length}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-foreground">{report?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Validation</p>
              <p className="text-2xl font-bold text-foreground">{pendingValidation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employee</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Punch In</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Punch Out</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hours</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : !report?.records?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No attendance records found for {format(new Date(date + "T00:00:00"), "MMMM d, yyyy")}.
                  </TableCell>
                </TableRow>
              ) : (
                report.records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">{record.user?.name}</div>
                      <div className="text-xs text-muted-foreground">{record.user?.email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {format(new Date(record.punchInTime), "HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
