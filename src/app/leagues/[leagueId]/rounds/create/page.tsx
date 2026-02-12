"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormInput } from "~/components/ui/form-input";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateRound() {
  const params = useParams<{ leagueId: string }>();
  const router = useRouter();

  const defaultSubmission = new Date();
  defaultSubmission.setDate(defaultSubmission.getDate() + 3);
  const defaultVoting = new Date();
  defaultVoting.setDate(defaultVoting.getDate() + 5);

  const [themeName, setThemeName] = useState("");
  const [themeDescription, setThemeDescription] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState(
    toLocalDatetimeString(defaultSubmission),
  );
  const [votingDeadline, setVotingDeadline] = useState(
    toLocalDatetimeString(defaultVoting),
  );
  const [themeBrowserOpen, setThemeBrowserOpen] = useState(false);

  const createRound = api.round.create.useMutation({
    onSuccess: (round) => {
      router.push(`/leagues/${params.leagueId}/rounds/${round.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subDate = new Date(submissionDeadline);
    const voteDate = new Date(votingDeadline);

    createRound.mutate({
      leagueId: params.leagueId,
      themeName,
      themeDescription: themeDescription || undefined,
      submissionDeadline: subDate.toISOString(),
      votingDeadline: voteDate.toISOString(),
    });
  };

  const validationError = (() => {
    const sub = new Date(submissionDeadline);
    const vote = new Date(votingDeadline);
    if (vote <= sub) return "Voting deadline must be after submission deadline";
    if (sub <= new Date()) return "Submission deadline must be in the future";
    return null;
  })();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create a New Round</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme-name">Theme</Label>
              <div className="flex gap-2">
                <Input
                  id="theme-name"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. Guilty Pleasures"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setThemeBrowserOpen(true)}
                >
                  <BookOpen className="h-4 w-4" />
                  Browse
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme-desc">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="theme-desc"
                rows={2}
                maxLength={500}
                placeholder="Describe the theme to help participants..."
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
              />
            </div>

            <FormInput
              id="submission-deadline"
              label="Submission Deadline"
              type="datetime-local"
              required
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
            />

            <FormInput
              id="voting-deadline"
              label="Voting Deadline"
              type="datetime-local"
              required
              value={votingDeadline}
              onChange={(e) => setVotingDeadline(e.target.value)}
              error={votingDeadline && submissionDeadline ? (validationError ?? undefined) : undefined}
            />

            {createRound.error && (
              <p className="text-sm text-destructive">{createRound.error.message}</p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createRound.isPending}
                disabled={!themeName.trim() || !!validationError}
              >
                Create Round
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ThemeBrowserModal
        open={themeBrowserOpen}
        onClose={() => setThemeBrowserOpen(false)}
        onSelect={(name, description) => {
          setThemeName(name);
          if (description) setThemeDescription(description);
          setThemeBrowserOpen(false);
        }}
      />
    </div>
  );
}

function ThemeBrowserModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string, description: string) => void;
}) {
  const { data: categories } = api.theme.getAll.useQuery(undefined, {
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Browse Themes</DialogTitle>
        </DialogHeader>
        {categories ? (
          <div className="max-h-[60vh] space-y-5 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.category}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {cat.category}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {cat.themes.map((theme) => (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => onSelect(theme.name, theme.description)}
                      className="cursor-pointer rounded-lg border border-border/50 p-3 text-left transition-colors hover:border-primary hover:bg-muted"
                    >
                      <p className="text-sm font-medium">
                        {theme.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {theme.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
