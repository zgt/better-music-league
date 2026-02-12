"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Copy, Check, Settings, Plus, LogOut, Trash2, Trophy, Users } from "lucide-react";

import { api } from "~/trpc/react";
import { Card } from "~/app/_components/ui/card";
import { Button } from "~/app/_components/ui/button";
import { Badge } from "~/app/_components/ui/badge";
import { Input } from "~/app/_components/ui/input";
import { Modal } from "~/app/_components/ui/modal";
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
          <div className="h-8 w-48 rounded bg-bg-tertiary" />
          <div className="h-4 w-72 rounded bg-bg-tertiary" />
        </div>
      </div>
    );
  }

  if (!league) return null;

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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          {league.description && (
            <p className="mt-1 text-text-muted">{league.description}</p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Invite Link</p>
            <p className="mt-0.5 text-sm text-text-muted break-all">{inviteUrl}</p>
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
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Standings + Rounds */}
        <div className="space-y-6 lg:col-span-2">
          {/* Standings */}
          <LeagueStandings leagueId={league.id} />

          {/* Rounds */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <span>Rounds</span>
                <Link href={`/leagues/${league.id}/rounds/create`}>
                  <Button size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Create Round
                  </Button>
                </Link>
              </div>
            }
          >
            {league.rounds.length > 0 ? (
              <div className="space-y-3">
                {league.rounds.map((round) => {
                  const isScored = round.status === "RESULTS" || round.status === "COMPLETED";
                  const winner = isScored ? getRoundWinner(round.submissions) : null;

                  return (
                    <Link
                      key={round.id}
                      href={`/leagues/${league.id}/rounds/${round.id}`}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-bg-tertiary"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          Round {round.roundNumber}: {round.themeName}
                        </p>
                        {winner && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-text-muted">
                            <Trophy className="h-3 w-3 text-yellow-500" />
                            {winner.userName} &middot; {winner.trackName}
                          </p>
                        )}
                        {!winner && round.themeDescription && (
                          <p className="mt-0.5 text-sm text-text-muted">
                            {round.themeDescription}
                          </p>
                        )}
                      </div>
                      <Badge phase={statusToBadgePhase[round.status] ?? "results"} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No rounds yet. Create the first one!</p>
            )}
          </Card>
        </div>

        {/* Right column: Members */}
        <div>
          <Card header={`Members (${league._count.members})`}>
            <div className="space-y-3">
              {league.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  {member.user.image ? (
                    <Image
                      src={member.user.image}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                      {member.user.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{member.user.name}</p>
                    <p className="text-xs text-text-muted">{roleLabels[member.role]}</p>
                  </div>
                </div>
              ))}
            </div>
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
    <Modal
      open={open}
      onClose={onClose}
      title="League Settings"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={updateSettings.isPending}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          id="settings-name"
          label="League Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-desc" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="settings-desc"
            className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-songs" className="text-sm font-medium text-text-primary">
            Songs per Round
          </label>
          <select
            id="settings-songs"
            className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            value={songsPerRound}
            onChange={(e) => setSongsPerRound(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="settings-points"
          label="Upvote Points per Round"
          type="number"
          min={1}
          max={20}
          value={upvotePoints}
          onChange={(e) => setUpvotePoints(Number(e.target.value))}
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allowDownvotes}
            onChange={(e) => setAllowDownvotes(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-bg-tertiary accent-accent"
          />
          <span className="text-sm text-text-primary">Allow downvotes</span>
        </label>

        {updateSettings.error && (
          <p className="text-sm text-danger">{updateSettings.error.message}</p>
        )}

        <hr className="border-border" />

        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onLeave} loading={isLeaving}>
            <LogOut className="h-4 w-4" />
            Leave League
          </Button>
          <Button variant="danger" onClick={onDelete} loading={isDeleting}>
            <Trash2 className="h-4 w-4" />
            Delete League
          </Button>
        </div>
      </div>
    </Modal>
  );
}
