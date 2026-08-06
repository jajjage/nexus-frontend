"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminAppUpdateService,
  AppVersionConfig,
} from "@/services/admin/app-update.service";
import {
  RefreshCw,
  Save,
  Smartphone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function AppUpdateManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState<AppVersionConfig>({
    latestVersion: "1.69.0",
    minVersion: "1.0.0",
    title: "We have an app upgrade for you",
    subtitle:
      "We've made the app even better! Update now to enjoy a more seamless experience.",
    releaseNotes:
      "For your security and access to the latest features, you'll need to update to the newest version of the app.",
    iosUrl: "https://apps.apple.com/app/nexus/id123456789",
    androidUrl:
      "https://play.google.com/store/apps/details?id=com.nexus.mobile",
  });

  const fetchVersionConfig = async () => {
    setLoading(true);
    try {
      const res = await adminAppUpdateService.getAppVersion();
      if (res.success && res.data) {
        setForm(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load version config", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersionConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await adminAppUpdateService.updateAppVersion(form);
      if (res.success) {
        setMessage({
          type: "success",
          text: "App update configuration saved successfully!",
        });
        if (res.data) setForm(res.data);
      } else {
        setMessage({
          type: "error",
          text: res.message || "Failed to update configuration",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "An error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="text-primary h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-2 text-sm">
          Loading app update configuration...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-all duration-200 ease-out ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="text-primary h-5 w-5" />
            <CardTitle>Mobile Version Control</CardTitle>
          </div>
          <CardDescription>
            Configure version parameters to control soft and forced app updates
            for mobile clients.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latestVersion" className="font-semibold">
                Latest Published Version
              </Label>
              <Input
                id="latestVersion"
                value={form.latestVersion}
                onChange={(e) =>
                  setForm({ ...form, latestVersion: e.target.value })
                }
                placeholder="e.g. 1.69.0"
                required
              />
              <p className="text-muted-foreground text-xs">
                Mobile users on versions below this will see the optional
                upgrade modal.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minVersion" className="font-semibold">
                Minimum Required Version (Force Update)
              </Label>
              <Input
                id="minVersion"
                value={form.minVersion}
                onChange={(e) =>
                  setForm({ ...form, minVersion: e.target.value })
                }
                placeholder="e.g. 1.65.0"
                required
              />
              <p className="text-muted-foreground text-xs">
                Mobile users below this version will be forced to update without
                a skip option.
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-semibold">Modal UI Content</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Modal Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="We have an app upgrade for you"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Modal Subtitle</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="We've made the app even better! Update now to enjoy..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseNotes">
                Release Description / What's New
              </Label>
              <Textarea
                id="releaseNotes"
                rows={4}
                value={form.releaseNotes}
                onChange={(e) =>
                  setForm({ ...form, releaseNotes: e.target.value })
                }
                placeholder="For your security and access to the latest features..."
                required
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-semibold">App Store URLs</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="iosUrl">iOS App Store Link</Label>
                <Input
                  id="iosUrl"
                  value={form.iosUrl}
                  onChange={(e) => setForm({ ...form, iosUrl: e.target.value })}
                  placeholder="https://apps.apple.com/..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="androidUrl">Google Play Store Link</Label>
                <Input
                  id="androidUrl"
                  value={form.androidUrl}
                  onChange={(e) =>
                    setForm({ ...form, androidUrl: e.target.value })
                  }
                  placeholder="https://play.google.com/..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 font-semibold transition-all duration-150 ease-out hover:opacity-95 active:scale-[0.97]"
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Upgrade Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
