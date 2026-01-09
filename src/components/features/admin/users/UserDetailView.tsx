"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminRoles, useAssignRole } from "@/hooks/admin/useAdminRoles";
import {
  useAdminUser,
  useAdminUserSessions,
  useCreditWallet,
  useDebitWallet,
  useDisable2FA,
  useRevokeUserSessions,
  useSuspendUser,
  useUnsuspendUser,
  useUpdateUser,
} from "@/hooks/admin/useAdminUsers";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  CreditCard,
  KeyRound,
  Laptop,
  Loader2,
  MinusCircle,
  Pencil,
  PlusCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserActivityTable } from "../audit/UserActivityTable";
import { Setup2FAModal } from "./Setup2FAModal";

interface UserDetailViewProps {
  userId: string;
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useAdminUser(userId);
  const { data: sessionsData, isLoading: isSessionsLoading } =
    useAdminUserSessions(userId);
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const creditMutation = useCreditWallet();
  const debitMutation = useDebitWallet();
  const disable2FAMutation = useDisable2FA();
  const updateUserMutation = useUpdateUser();
  const revokeSessionsMutation = useRevokeUserSessions();
  const { data: rolesData, isLoading: isRolesLoading } = useAdminRoles();
  const assignRoleMutation = useAssignRole();

  const [creditAmount, setCreditAmount] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", phoneNumber: "" });

  const user = data?.data;
  const sessions = sessionsData?.data?.sessions || [];

  // Sync edit form with user data when loaded
  useEffect(() => {
    if (user) {
      setEditForm({ fullName: user.fullName, phoneNumber: user.phoneNumber });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load user details</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/admin/dashboard/users">Back to Users</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleCredit = () => {
    const amount = parseFloat(creditAmount);
    if (amount > 0) {
      creditMutation.mutate({ userId, data: { amount } });
      setCreditAmount("");
    }
  };

  const handleDebit = () => {
    const amount = parseFloat(debitAmount);
    if (amount > 0) {
      debitMutation.mutate({ userId, data: { amount } });
      setDebitAmount("");
    }
  };

  const handleUpdateUser = () => {
    updateUserMutation.mutate(
      { userId, data: editForm },
      {
        onSuccess: () => setIsEditOpen(false),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user.isSuspended ? (
            <Badge variant="destructive">Suspended</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )}
          <Badge variant="outline" className="capitalize">
            {user.role}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to the user&apos;s profile information here.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phoneNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleUpdateUser}
                    disabled={updateUserMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">{user.fullName}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{user.phoneNumber}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Verified</Label>
              <p className="font-medium">{user.isVerified ? "Yes" : "No"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Wallet Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">Current Balance</p>
              <p className="text-3xl font-bold">
                ₦
                {user.balance !== undefined && user.balance !== null
                  ? Number(user.balance).toLocaleString()
                  : 0}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
                <Button
                  onClick={handleCredit}
                  disabled={creditMutation.isPending}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Credit
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={debitAmount}
                  onChange={(e) => setDebitAmount(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleDebit}
                  disabled={debitMutation.isPending}
                >
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Debit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Suspend/Unsuspend */}
            {user.isSuspended ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Unsuspend User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unsuspend User?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore access for {user.fullName}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => unsuspendMutation.mutate(userId)}
                    >
                      Unsuspend
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspend User?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will prevent {user.fullName} from accessing the
                      platform.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => suspendMutation.mutate(userId)}
                    >
                      Suspend
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Role Assignment */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-muted-foreground">Assign Role</Label>
              <div className="flex gap-2">
                <Select
                  disabled={isRolesLoading || assignRoleMutation.isPending}
                  onValueChange={(roleId) => {
                    assignRoleMutation.mutate({ userId, roleId });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesData?.data?.roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-muted-foreground text-xs">
                Current:{" "}
                <span className="font-medium capitalize">{user.role}</span>
              </p>
            </div>

            {/* 2FA Actions */}
            <div className="space-y-2">
              {/* 2FA Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">2FA Status</span>
                <Badge
                  variant={user.twoFactorEnabled ? "default" : "secondary"}
                >
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              {/* Setup or Disable 2FA */}
              {user.role === "admin" && (
                <>
                  {user.twoFactorEnabled ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Disable 2FA
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable 2FA?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will disable two-factor authentication for{" "}
                            {user.fullName}. They will need to set it up again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => disable2FAMutation.mutate(userId)}
                          >
                            Disable 2FA
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIs2FAModalOpen(true)}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Setup 2FA
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            {sessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={revokeSessionsMutation.isPending}
                  >
                    {revokeSessionsMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Revoke All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke All Sessions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will log {user.fullName} out of all devices. They
                      will need to log in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => revokeSessionsMutation.mutate(userId)}
                    >
                      Revoke Sessions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent>
            {isSessionsLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No active sessions
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session: any) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      session.isCurrent ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {session.userAgent?.os || "Unknown OS"}
                        </p>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current Device
                          </Badge>
                        )}
                        {!session.isCurrent && session.userAgent?.type && (
                          <Badge variant="outline" className="text-xs">
                            {session.userAgent.type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {session.userAgent?.browser || "Unknown Browser"} •{" "}
                        {session.userAgent?.device || "Unknown Device"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        IP: {session.ip || session.ipAddress || "Unknown"} •
                        Last active:{" "}
                        {session.lastActivity
                          ? new Date(session.lastActivity).toLocaleString()
                          : session.lastActiveAt
                            ? new Date(session.lastActiveAt).toLocaleString()
                            : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Activity Log */}
      <UserActivityTable userId={userId} />

      {/* Setup 2FA Modal */}
      <Setup2FAModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        userId={userId}
        userName={user.fullName}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["admin", "users", "detail", userId],
          });
        }}
      />
    </div>
  );
}
