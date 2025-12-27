"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBiometricEnrollments,
  useRevokeEnrollment,
} from "@/hooks/useBiometric";
import { formatDistanceToNow } from "date-fns";
import { Laptop, Smartphone, Trash2 } from "lucide-react";

export function BiometricManagement() {
  const { data: enrollments, isLoading } = useBiometricEnrollments();
  const { mutate: revoke, isPending: isRevoking } = useRevokeEnrollment();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>Loading your devices...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>
            You have no devices registered for biometric login.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getIcon = (platform: string) => {
    if (platform === "ios" || platform === "android")
      return <Smartphone className="size-5" />;
    return <Laptop className="size-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Devices</CardTitle>
        <CardDescription>
          Manage devices that can access your account using biometrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-start gap-4">
              <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                {getIcon(enrollment.platform)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{enrollment.device_name}</p>
                  {enrollment.authenticator_attachment === "platform" && (
                    <Badge variant="secondary" className="text-xs">
                      Built-in
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground space-y-0.5 text-sm">
                  <p>
                    Registered{" "}
                    {formatDistanceToNow(new Date(enrollment.enrolled_at), {
                      addSuffix: true,
                    })}
                  </p>
                  {enrollment.last_verified_at && (
                    <p>
                      Last used{" "}
                      {formatDistanceToNow(
                        new Date(enrollment.last_verified_at),
                        {
                          addSuffix: true,
                        }
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => revoke({ id: enrollment.id })}
              disabled={isRevoking}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
