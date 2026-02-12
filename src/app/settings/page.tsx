"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormInput } from "~/components/ui/form-input";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
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
} from "~/components/ui/alert-dialog";

export default function SettingsPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  const [name, setName] = useState<string | null>(null);

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      void utils.user.getProfile.invalidate();
    },
  });

  const deleteAccount = api.user.deleteAccount.useMutation({
    onSuccess: async () => {
      await authClient.signOut();
      router.push("/");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = name ?? profile.name;
  const prefs = profile.notificationPreferences;

  const handleSaveName = () => {
    if (!displayName.trim() || displayName === profile.name) return;
    updateProfile.mutate({ name: displayName.trim() });
  };

  const handleToggleNotification = (
    key: keyof typeof prefs,
    value: boolean,
  ) => {
    updateProfile.mutate({
      notificationPreferences: { ...prefs, [key]: value },
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {/* Display Name */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <FormInput
                id="display-name"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleSaveName}
              loading={updateProfile.isPending}
              disabled={!displayName.trim() || displayName === profile.name}
            >
              Save
            </Button>
          </div>
          {updateProfile.isSuccess && (
            <p className="mt-2 text-sm text-success">Updated.</p>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="round-start" className="cursor-pointer">Round starts</Label>
              <Switch
                id="round-start"
                checked={prefs.roundStart}
                onCheckedChange={(v) => handleToggleNotification("roundStart", v)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="sub-deadline" className="cursor-pointer">Submission deadline reminder</Label>
              <Switch
                id="sub-deadline"
                checked={prefs.submissionDeadline}
                onCheckedChange={(v) => handleToggleNotification("submissionDeadline", v)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="voting-open" className="cursor-pointer">Voting opens</Label>
              <Switch
                id="voting-open"
                checked={prefs.votingOpen}
                onCheckedChange={(v) => handleToggleNotification("votingOpen", v)}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <Label htmlFor="results-avail" className="cursor-pointer">Results available</Label>
              <Switch
                id="results-avail"
                checked={prefs.resultsAvailable}
                onCheckedChange={(v) => handleToggleNotification("resultsAvailable", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your account? This action is
                    permanent and cannot be undone. All your leagues, submissions, and
                    votes will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccount.mutate()}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleteAccount.isPending ? "Deleting..." : "Delete My Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
