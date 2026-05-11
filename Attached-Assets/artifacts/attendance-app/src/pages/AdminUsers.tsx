import { useState } from "react";
import {
  useListUsers,
  useUpdateUserRole,
  useGetUser,
  getListUsersQueryKey,
  getGetUserQueryKey,
} from "@workspace/api-client-react";
import { UserRoleUpdateRole } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Info, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const roleColors: Record<string, string> = {
  admin: "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  manager: "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  employee: "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
};

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const updateRole = useUpdateUserRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRoleChange = (userId: number, newRole: UserRoleUpdateRole) => {
    updateRole.mutate(
      { userId, data: { role: newRole } },
      {
        onSuccess: () => {
          toast({ title: "User role updated successfully" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update role", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users ? `${users.length} users in system` : "Manage employee access and roles"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["employee", "manager", "admin"].map((role) => (
          <Card key={role} className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground capitalize">{role}s</p>
                <p className="text-xl font-bold text-foreground">
                  {users ? users.filter((u) => u.role === role).length : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-5">User</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Role</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[160px]">Change Role</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide pr-5">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-7 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 border border-border shrink-0">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                            {user.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${roleColors[user.role] || ""}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(val) => handleRoleChange(user.id, val as UserRoleUpdateRole)}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="h-7 text-xs font-medium bg-background border-border text-foreground w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="employee" className="text-xs font-medium">Employee</SelectItem>
                          <SelectItem value="manager" className="text-xs font-medium">Manager</SelectItem>
                          <SelectItem value="admin" className="text-xs font-medium text-red-600">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <UserDetailsDialog userId={user.id} />
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

function UserDetailsDialog({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const { data: user, isLoading } = useGetUser(userId, {
    query: { enabled: open, queryKey: getGetUserQueryKey(userId) },
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
          <DialogTitle className="text-foreground">User Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : user ? (
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-border shadow-sm">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                  {user.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-base font-bold text-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize mt-1.5 ${roleColors[user.role] || ""}`}
                >
                  {user.role}
                </Badge>
              </div>
            </div>

            <Card className="border-border bg-muted/30 shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5 text-sm">
                {[
                  ["User ID", `#${user.id}`],
                  ["Department", user.department || "Not assigned"],
                  ["Member since", format(new Date(user.createdAt), "MMMM dd, yyyy")],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">User not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
