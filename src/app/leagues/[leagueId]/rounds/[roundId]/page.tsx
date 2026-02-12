"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  ListMusic,
  Music2,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as DialogTitleComp,
  DialogFooter,
} from "~/components/ui/dialog";
import { FormInput } from "~/components/ui/form-input";
import { SubmitSong } from "~/app/_components/submission/submit-song";
import { TrackList } from "~/app/_components/submission/track-list";
import { VoteInterface } from "~/app/_components/voting/vote-interface";
import { RoundResults } from "~/app/_components/results/round-results";

const PHASES = ["SUBMISSION", "LISTENING", "VOTING", "RESULTS"] as const;
const PHASE_LABELS: Record<string, string> = {
  SUBMISSION: "Submit",
  LISTENING: "Listen",
  VOTING: "Vote",
  RESULTS: "Results",
  COMPLETED: "Done",
};

const statusToBadgePhase: Record<
  string,
  "submission" | "listening" | "voting" | "results"
> = {
  SUBMISSION: "submission",
  LISTENING: "listening",
  VOTING: "voting",
  RESULTS: "results",
  COMPLETED: "results",
};

function useCountdown(deadline: Date): string {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function PhaseProgressBar({ status }: { status: string }) {
  const currentIndex = PHASES.indexOf(status as (typeof PHASES)[number]);
  const isCompleted = status === "COMPLETED";

  return (
    <div className="flex items-center gap-1">
      {PHASES.map((phase, i) => {
        const isActive = phase === status;
        const isPast = isCompleted || i < currentIndex;

        return (
          <div key={phase} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-0.5 w-4 sm:w-8 ${
                  isPast ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isPast
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs ${
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RoundDetail() {
  const params = useParams<{ leagueId: string; roundId: string }>();
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [playlistUrlInput, setPlaylistUrlInput] = useState("");
  const [playlistUrlSaved, setPlaylistUrlSaved] = useState(false);

  const utils = api.useUtils();

  const { data: round, isLoading } = api.round.getById.useQuery({
    roundId: params.roundId,
  });

  const advancePhase = api.round.advancePhase.useMutation({
    onSuccess: () => {
      void utils.round.getById.invalidate({ roundId: params.roundId });
      setConfirmAdvance(false);
    },
  });

  const setPlaylistUrl = api.round.setPlaylistUrl.useMutation({
    onSuccess: () => {
      void utils.round.getById.invalidate({ roundId: params.roundId });
      setPlaylistUrlSaved(true);
      setTimeout(() => setPlaylistUrlSaved(false), 2000);
    },
  });

  const generatePlaylist = api.round.generatePlaylist.useMutation({
    onSuccess: (data) => {
      void utils.round.getById.invalidate({ roundId: params.roundId });
      setPlaylistUrlInput(data.playlistUrl);
      setPlaylistUrlSaved(true);
      setTimeout(() => setPlaylistUrlSaved(false), 2000);
      toast.success("Playlist generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Sync playlist URL input with server state
  useEffect(() => {
    if (round?.playlistUrl) {
      setPlaylistUrlInput(round.playlistUrl);
    }
  }, [round?.playlistUrl]);

  const activeDeadline =
    round?.status === "SUBMISSION"
      ? new Date(round.submissionDeadline)
      : round?.status === "VOTING"
        ? new Date(round.votingDeadline)
        : null;

  const countdown = useCountdown(activeDeadline ?? new Date(0));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-48 rounded" />
          <div className="bg-muted h-4 w-72 rounded" />
          <div className="bg-muted h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Music2 className="text-muted-foreground h-6 w-6" />
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Round not found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              This round doesn&apos;t exist or you don&apos;t have access.
            </p>
          </div>
          <Link
            href={`/leagues/${params.leagueId}`}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Back to League
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = round.userRole === "OWNER" || round.userRole === "ADMIN";
  const canAdvance = isAdmin && round.status !== "COMPLETED";

  const phase = statusToBadgePhase[round.status] ?? "results";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/leagues/${params.leagueId}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to league
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">
              Round {round.roundNumber} &middot; {round.leagueName}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{round.themeName}</h1>
            {round.themeDescription && (
              <p className="text-muted-foreground mt-1">
                {round.themeDescription}
              </p>
            )}
          </div>
          <Badge variant={phase} className="mt-1">
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Phase progress */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <PhaseProgressBar status={round.status} />

            {activeDeadline && countdown !== "Ended" && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">
                  {round.status === "SUBMISSION"
                    ? "Submissions close"
                    : "Voting closes"}{" "}
                  in
                </span>
                <span className="font-mono font-medium">{countdown}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase-specific content */}
      <PhaseContent round={round} />

      {/* Admin controls */}
      {isAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Playlist URL */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <FormInput
                      label="Spotify Playlist URL"
                      placeholder="https://open.spotify.com/playlist/..."
                      value={playlistUrlInput}
                      onChange={(e) => setPlaylistUrlInput(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setPlaylistUrl.mutate({
                        roundId: params.roundId,
                        playlistUrl: playlistUrlInput,
                      })
                    }
                    loading={setPlaylistUrl.isPending}
                  >
                    {playlistUrlSaved ? <Check className="h-4 w-4" /> : "Save"}
                  </Button>
                </div>
                {setPlaylistUrl.error && (
                  <p className="text-destructive text-xs">
                    {setPlaylistUrl.error.message}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    generatePlaylist.mutate({ roundId: params.roundId })
                  }
                  loading={generatePlaylist.isPending}
                >
                  <Music2 className="mr-2 h-4 w-4" />
                  Auto-generate Playlist on Spotify
                </Button>
                <p className="text-muted-foreground text-xs">
                  Connect your Spotify account to auto-generate a playlist, or
                  manually create one and paste the link above.
                </p>
              </div>

              {/* Advance phase */}
              {canAdvance && (
                <div className="border-border/50 flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Advance Phase</p>
                    <p className="text-muted-foreground text-xs">
                      Move the round to the next phase
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmAdvance(true)}
                  >
                    Advance Phase
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advance confirmation dialog */}
      <Dialog
        open={confirmAdvance}
        onOpenChange={(open) => {
          if (!open) setConfirmAdvance(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitleComp>Advance Phase?</DialogTitleComp>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will move the round from{" "}
            <span className="font-medium">{PHASE_LABELS[round.status]}</span> to
            the next phase. This cannot be undone.
          </p>
          {advancePhase.error && (
            <p className="text-destructive mt-2 text-sm">
              {advancePhase.error.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmAdvance(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => advancePhase.mutate({ roundId: params.roundId })}
              loading={advancePhase.isPending}
            >
              Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhaseContent({
  round,
}: {
  round: {
    id: string;
    status: string;
    songsPerRound: number;
    submissions: {
      id: string;
      trackName: string;
      artistName: string;
      albumName: string;
      albumArtUrl: string;
      spotifyTrackId: string;
      previewUrl?: string | null;
      trackDurationMs?: number;
      submitter: { id: string; name: string; image: string | null } | null;
      totalPoints: number;
      isOwn: boolean;
    }[];
    submissionCount: number;
    memberCount: number;
    leagueId: string;
    playlistUrl: string | null;
    upvotePointsPerRound: number;
    allowDownvotes: boolean;
    downvotePointValue: number;
  };
}) {
  if (round.status === "SUBMISSION") {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 py-2 text-center">
              <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Music2 className="text-primary h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Submission Phase</p>
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium">
                    {round.submissionCount}/{round.memberCount}
                  </span>{" "}
                  members have submitted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <SubmitSong roundId={round.id} songsPerRound={round.songsPerRound} />
      </div>
    );
  }

  if (round.status === "LISTENING") {
    return (
      <div className="space-y-4">
        {/* Playlist banner */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <ListMusic className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Listening Phase</p>
                  <p className="text-muted-foreground text-xs">
                    Listen to all {round.submissions.length} tracks before
                    voting begins
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {round.playlistUrl && (
                  <a
                    href={round.playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="default" size="sm">
                      <ExternalLink className="h-4 w-4" />
                      Spotify Playlist
                    </Button>
                  </a>
                )}
                <Link
                  href={`/leagues/${round.leagueId}/rounds/${round.id}/playlist`}
                >
                  <Button variant="secondary" size="sm">
                    <ListMusic className="h-4 w-4" />
                    Full Playlist
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <TrackList
          tracks={round.submissions.map((s) => ({
            id: s.id,
            trackName: s.trackName,
            artistName: s.artistName,
            albumName: s.albumName,
            albumArtUrl: s.albumArtUrl,
            spotifyTrackId: s.spotifyTrackId,
            previewUrl: s.previewUrl ?? null,
            trackDurationMs: s.trackDurationMs ?? 0,
            isOwn: s.isOwn,
          }))}
        />
      </div>
    );
  }

  if (round.status === "VOTING") {
    return (
      <VoteInterface
        roundId={round.id}
        submissions={round.submissions.map((s) => ({
          id: s.id,
          trackName: s.trackName,
          artistName: s.artistName,
          albumName: s.albumName,
          albumArtUrl: s.albumArtUrl,
          spotifyTrackId: s.spotifyTrackId,
          previewUrl: s.previewUrl,
          trackDurationMs: s.trackDurationMs,
          isOwn: s.isOwn,
        }))}
        upvotePointsPerRound={round.upvotePointsPerRound}
        allowDownvotes={round.allowDownvotes}
        downvotePointValue={round.downvotePointValue}
        memberCount={round.memberCount}
      />
    );
  }

  // RESULTS or COMPLETED
  return <RoundResults roundId={round.id} />;
}
