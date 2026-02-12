"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check, Music2, Settings, Plus, LogOut, Trash2, Trophy, Users } from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FormInput } from "~/components/ui/form-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { LeagueStandings } from "~/app/_components/results/league-standings";

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

const statusToBadgePhase: Record<string, "submission" | "listening" | "voting" | "results"> = {
  SUBMISSION: "submission",
  LISTENING: "listening",
  VOTING: "voting",
  RESULTS: "results",
  COMPLETED: "results",
};

function getRoundWinner(
  submissions: {
    user: { name: string };
    trackName: string;
    votes: { points: number }[];
  }[],
): { userName: string; trackName: string } | null {
  if (submissions.length === 0) return null;

  let winner = submissions[0]!;
  let maxPoints = winner.votes.reduce((sum, v) => sum + v.points, 0);

  for (const sub of submissions.slice(1)) {
    const pts = sub.votes.reduce((sum, v) => sum + v.points, 0);
    if (pts > maxPoints) {
      maxPoints = pts;
      winner = sub;
    }
  }

  return { userName: winner.user.name, trackName: winner.trackName };
}

export default function LeagueDetail() {
  const params = useParams<{ leagueId: string }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const utils = api.useUtils();

  const { data: league, isLoading } = api.league.getById.useQuery({
    id: params.leagueId,
  });

  const leaveLeague = api.league.leave.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  const deleteLeague = api.league.delete.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  const regenerateCode = api.league.regenerateInviteCode.useMutation({
    onSuccess: () => utils.league.getById.invalidate({ id: params.leagueId }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">League not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This league doesn&apos;t exist or you&apos;re not a member.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${league.inviteCode}`
      : `/join/${league.inviteCode}`;

  const handleCopyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          {league.description && (
            <p className="mt-1 text-muted-foreground">{league.description}</p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {league._count.members} member{league._count.members !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Invite Link */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Invite Link</p>
              <p className="mt-0.5 text-sm text-muted-foreground break-all">{inviteUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopyInvite}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerateCode.mutate({ leagueId: league.id })}
                loading={regenerateCode.isPending}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Standings + Rounds */}
        <div className="space-y-6 lg:col-span-2">
          {/* Standings */}
          <LeagueStandings leagueId={league.id} />

          {/* Rounds */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rounds</CardTitle>
                <Link href={`/leagues/${league.id}/rounds/create`}>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Create Round
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {league.rounds.length > 0 ? (
                <div className="space-y-3">
                  {league.rounds.map((round) => {
                    const isScored = round.status === "RESULTS" || round.status === "COMPLETED";
                    const winner = isScored ? getRoundWinner(round.submissions) : null;
                    const phase = statusToBadgePhase[round.status] ?? "results";

                    return (
                      <Link
                        key={round.id}
                        href={`/leagues/${league.id}/rounds/${round.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            Round {round.roundNumber}: {round.themeName}
                          </p>
                          {winner && (
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              {winner.userName} &middot; {winner.trackName}
                            </p>
                          )}
                          {!winner && round.themeDescription && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {round.themeDescription}
                            </p>
                          )}
                        </div>
                        <Badge variant={phase}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Badge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Music2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No rounds yet</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Create the first round to get the competition started.
                  </p>
                </div>
                <Link href={`/leagues/${league.id}/rounds/create`}>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Create First Round
                  </Button>
                </Link>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Members */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Members ({league._count.members})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {league.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image ?? undefined} />
                      <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                        {member.user.name?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">{roleLabels[member.role]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        league={league}
        onLeave={() => leaveLeague.mutate({ leagueId: league.id })}
        onDelete={() => {
          if (confirm("Are you sure you want to delete this league? This cannot be undone.")) {
            deleteLeague.mutate({ leagueId: league.id });
          }
        }}
        isLeaving={leaveLeague.isPending}
        isDeleting={deleteLeague.isPending}
      />
    </div>
  );
}

function SettingsModal({
  open,
  onClose,
  league,
  onLeave,
  onDelete,
  isLeaving,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  league: {
    id: string;
    name: string;
    description: string | null;
    songsPerRound: number;
    allowDownvotes: boolean;
    upvotePointsPerRound: number;
    members: { role: string; userId: string }[];
  };
  onLeave: () => void;
  onDelete: () => void;
  isLeaving: boolean;
  isDeleting: boolean;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? "");
  const [songsPerRound, setSongsPerRound] = useState(league.songsPerRound);
  const [allowDownvotes, setAllowDownvotes] = useState(league.allowDownvotes);
  const [upvotePoints, setUpvotePoints] = useState(league.upvotePointsPerRound);

  const updateSettings = api.league.updateSettings.useMutation({
    onSuccess: () => {
      void utils.league.getById.invalidate({ id: league.id });
      onClose();
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      leagueId: league.id,
      name,
      description: description || undefined,
      songsPerRound,
      allowDownvotes,
      upvotePointsPerRound: upvotePoints,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>League Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormInput
            id="settings-name"
            label="League Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-desc">Description</Label>
            <Textarea
              id="settings-desc"
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-songs">Songs per Round</Label>
            <Select
              value={String(songsPerRound)}
              onValueChange={(value) => setSongsPerRound(Number(value))}
            >
              <SelectTrigger id="settings-songs" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormInput
            id="settings-points"
            label="Upvote Points per Round"
            type="number"
            min={1}
            max={20}
            value={upvotePoints}
            onChange={(e) => setUpvotePoints(Number(e.target.value))}
          />

          <div className="flex items-center gap-3">
            <Checkbox
              id="settings-downvotes"
              checked={allowDownvotes}
              onCheckedChange={(checked) => setAllowDownvotes(checked === true)}
            />
            <Label htmlFor="settings-downvotes">Allow downvotes</Label>
          </div>

          {updateSettings.error && (
            <p className="text-sm text-destructive">{updateSettings.error.message}</p>
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={onLeave} loading={isLeaving}>
              <LogOut className="h-4 w-4" />
              Leave League
            </Button>
            <Button variant="destructive" onClick={onDelete} loading={isDeleting}>
              <Trash2 className="h-4 w-4" />
              Delete League
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={updateSettings.isPending}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
