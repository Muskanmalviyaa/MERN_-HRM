import { useState } from "react";
import {
  useListOvertime,
  useCreateOvertime,
  useReviewOvertime,
  useGetMe,
  getListOvertimeQueryKey,
} from "@workspace/api-client-react";
import { UserRole } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Check, X } from "lucide-react";

export default function Overtime() {
  const { data: user } = useGetMe();
  const isEmployee = user?.role === UserRole.employee;
  const { data: otData, isLoading } = useListOvertime();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overtime Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {otData ? `${otData.length} total requests` : "Loading…"}
          </p>
        </div>
        {isEmployee && <CreateOvertimeDialog />}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</TableHead>
                {!isEmployee && (
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Employee</TableHead>
                )}
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hours</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
                {!isEmployee && (
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : otData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No overtime requests found.
                  </TableCell>
                </TableRow>
              ) : (
                otData?.map((ot) => (
                  <TableRow key={ot.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-sm font-medium text-foreground">
                      {format(new Date(ot.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    {!isEmployee && (
                      <TableCell className="text-sm font-semibold text-foreground">{ot.user?.name}</TableCell>
                    )}
                    <TableCell className="font-mono text-sm text-foreground">{ot.hoursRequested}h</TableCell>
                    <TableCell className="max-w-[200px] text-sm text-muted-foreground truncate">
                      {ot.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          ot.status === "approved"
                            ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs"
                            : ot.status === "rejected"
                            ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-xs"
                            : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-xs"
                        }
                      >
                        {ot.status}
                      </Badge>
                    </TableCell>
                    {!isEmployee && (
                      <TableCell className="text-right">
                        {ot.status === "pending" && <ReviewActions otId={ot.id} />}
                      </TableCell>
                    )}
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

function CreateOvertimeDialog() {
  const [open, setOpen] = useState(false);
  const [attendanceId, setAttendanceId] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createOt = useCreateOvertime();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOt.mutate(
      {
        data: {
          attendanceId: parseInt(attendanceId, 10),
          hoursRequested: parseFloat(hours),
          reason,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Overtime requested successfully" });
          setOpen(false);
          setAttendanceId("");
          setHours("");
          setReason("");
          queryClient.invalidateQueries({ queryKey: getListOvertimeQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Failed to request overtime", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold shadow-sm" size="sm">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Request Overtime
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Request Overtime</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="attId" className="text-foreground text-sm">Attendance Record ID</Label>
            <Input
              id="attId"
              type="number"
              required
              value={attendanceId}
              onChange={(e) => setAttendanceId(e.target.value)}
              placeholder="e.g. 12"
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">Find the ID from your Attendance History page.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours" className="text-foreground text-sm">Hours Requested</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 2.5"
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-foreground text-sm">Reason</Label>
            <Textarea
              id="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why overtime was needed…"
              rows={3}
              className="bg-background border-border text-foreground resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createOt.isPending}>
              {createOt.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReviewActions({ otId }: { otId: number }) {
  const reviewOt = useReviewOvertime();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleReview = (status: "approved" | "rejected") => {
    reviewOt.mutate(
      { id: otId, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Overtime ${status}` });
          queryClient.invalidateQueries({ queryKey: getListOvertimeQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="icon"
        variant="outline"
        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 border-border"
        onClick={() => handleReview("approved")}
        disabled={reviewOt.isPending}
        title="Approve"
      >
        <Check className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-border"
        onClick={() => handleReview("rejected")}
        disabled={reviewOt.isPending}
        title="Reject"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
