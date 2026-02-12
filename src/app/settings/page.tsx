"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import { Card } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Modal } from "../_components/ui/modal";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-accent" : "bg-bg-tertiary"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  const [name, setName] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-40 rounded bg-bg-tertiary" />
          <div className="h-48 rounded-xl bg-bg-secondary" />
          <div className="h-48 rounded-xl bg-bg-secondary" />
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
      <Card header="Display Name" className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
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
      </Card>

      {/* Notification Preferences */}
      <Card header="Email Notifications" className="mb-6">
        <div className="divide-y divide-border">
          <Toggle
            label="Round starts"
            checked={prefs.roundStart}
            onChange={(v) => handleToggleNotification("roundStart", v)}
          />
          <Toggle
            label="Submission deadline reminder"
            checked={prefs.submissionDeadline}
            onChange={(v) => handleToggleNotification("submissionDeadline", v)}
          />
          <Toggle
            label="Voting opens"
            checked={prefs.votingOpen}
            onChange={(v) => handleToggleNotification("votingOpen", v)}
          />
          <Toggle
            label="Results available"
            checked={prefs.resultsAvailable}
            onChange={(v) => handleToggleNotification("resultsAvailable", v)}
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card header="Danger Zone">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-sm text-text-muted">
              Permanently delete your account and all data.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </Button>
        </div>
      </Card>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
            >
              Delete My Account
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete your account? This action is
          permanent and cannot be undone. All your leagues, submissions, and
          votes will be removed.
        </p>
      </Modal>
    </div>
  );
}
