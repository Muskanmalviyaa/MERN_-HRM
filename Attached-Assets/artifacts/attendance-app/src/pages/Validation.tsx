import { useState } from "react";
import { useListAttendance, useValidateAttendance, getListAttendanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Validation() {
  const [page] = useState(1);
  const { data, isLoading } = useListAttendance(
    { page, limit: 50 },
    { query: { keepPreviousData: true } as any }
  );

  const pendingRecords = data?.records.filter((r) => r.validationStatus === "pending") || [];
  const processedRecords = data?.records.filter((r) => r.validationStatus !== "pending") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Selfie Validation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review employee selfie photos for authenticity</p>
        </div>
        <Badge
          variant="outline"
          className={
            pendingRecords.length > 0
              ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
              : "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          }
        >
          {pendingRecords.length > 0 ? `${pendingRecords.length} Pending` : "All Reviewed"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Review</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : pendingRecords.length === 0 ? (
            <div className="bg-muted/30 border border-dashed border-border rounded-xl p-12 text-center">
              <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-3 opacity-60" />
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending selfie validations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingRecords.map((record) => (
                <ValidationCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recently Processed</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : processedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No processed records yet.</p>
          ) : (
            <div className="space-y-2">
              {processedRecords.slice(0, 8).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-md bg-muted overflow-hidden flex-shrink-0">
                    {record.selfieUrl ? (
                      <img src={record.selfieUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{record.user?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(record.punchInTime), "MMM dd, HH:mm")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {record.validationStatus === "valid" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValidationCard({ record }: { record: any }) {
  const [remarks, setRemarks] = useState("");
  const [open, setOpen] = useState(false);
  const validateAtt = useValidateAttendance();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleValidate = (status: "valid" | "invalid") => {
    if (status === "invalid" && !remarks) {
      setOpen(true);
      return;
    }

    validateAtt.mutate(
      { id: record.id, data: { validationStatus: status, remarks: remarks || undefined } },
      {
        onSuccess: () => {
          toast({
            title: status === "valid" ? "Marked as valid ✓" : "Marked as invalid",
            variant: status === "valid" ? "default" : "destructive",
          });
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
        },
      }
    );
  };

  return (
    <Card className="overflow-hidden border-border bg-card hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-muted relative">
        {record.selfieUrl ? (
          <img src={record.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No selfie captured</p>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {format(new Date(record.punchInTime), "HH:mm")}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-3">
          <p className="font-bold text-foreground">{record.user?.name}</p>
          <p className="text-xs text-muted-foreground">{record.user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(record.punchInTime), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleValidate("valid")}
            disabled={validateAtt.isPending}
          >
            {validateAtt.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✓ Approve"}
          </Button>
          <Button
            className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
            onClick={() => handleValidate("invalid")}
            disabled={validateAtt.isPending}
          >
            ✗ Reject
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Reject Validation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Reason for rejection</Label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Blurry photo, Face not visible…"
                  autoFocus
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleValidate("invalid")}
                  disabled={!remarks || validateAtt.isPending}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
