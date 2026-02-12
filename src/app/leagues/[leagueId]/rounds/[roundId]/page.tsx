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

import { api } from "~/trpc/react";
import { Card } from "~/app/_components/ui/card";
import { Button } from "~/app/_components/ui/button";
import { Badge } from "~/app/_components/ui/badge";
import { Modal } from "~/app/_components/ui/modal";
import { Input } from "~/app/_components/ui/input";
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
                  isPast ? "bg-accent" : "bg-border"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-accent text-white"
                    : isPast
                      ? "bg-accent/20 text-accent"
                      : "bg-bg-tertiary text-text-muted"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs ${
                  isActive
                    ? "font-medium text-text-primary"
                    : "text-text-muted"
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
          <div className="h-8 w-48 rounded bg-bg-tertiary" />
          <div className="h-4 w-72 rounded bg-bg-tertiary" />
          <div className="h-32 rounded-xl bg-bg-tertiary" />
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
            <Music2 className="h-6 w-6 text-text-muted" />
          </div>
          <div>
            <p className="font-medium text-text-secondary">Round not found</p>
            <p className="mt-1 text-sm text-text-muted">
              This round doesn&apos;t exist or you don&apos;t have access.
            </p>
          </div>
          <Link
            href={`/leagues/${params.leagueId}`}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Back to League
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = round.userRole === "OWNER" || round.userRole === "ADMIN";
  const canAdvance =
    isAdmin && round.status !== "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/leagues/${params.leagueId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to league
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-text-muted">
              Round {round.roundNumber} &middot; {round.leagueName}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{round.themeName}</h1>
            {round.themeDescription && (
              <p className="mt-1 text-text-muted">{round.themeDescription}</p>
            )}
          </div>
          <Badge
            phase={statusToBadgePhase[round.status] ?? "results"}
            className="mt-1"
          />
        </div>
      </div>

      {/* Phase progress */}
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <PhaseProgressBar status={round.status} />

          {activeDeadline && countdown !== "Ended" && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-text-muted" />
              <span className="text-text-muted">
                {round.status === "SUBMISSION"
                  ? "Submissions close"
                  : "Voting closes"}{" "}
                in
              </span>
              <span className="font-mono font-medium">{countdown}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Phase-specific content */}
      <PhaseContent round={round} />

      {/* Admin controls */}
      {isAdmin && (
        <Card className="mt-6" header="Admin Controls">
          <div className="space-y-4">
            {/* Playlist URL */}
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
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
                  {playlistUrlSaved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              {setPlaylistUrl.error && (
                <p className="text-xs text-danger">
                  {setPlaylistUrl.error.message}
                </p>
              )}
              <p className="text-xs text-text-muted">
                Create a playlist on Spotify, then paste the link here. Members
                will see this on the playlist page.
              </p>
            </div>

            {/* Advance phase */}
            {canAdvance && (
              <div className="flex items-center justify-between border-t border-border/50 pt-4">
                <div>
                  <p className="text-sm font-medium">Advance Phase</p>
                  <p className="text-xs text-text-muted">
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
        </Card>
      )}

      {/* Advance confirmation modal */}
      <Modal
        open={confirmAdvance}
        onClose={() => setConfirmAdvance(false)}
        title="Advance Phase?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmAdvance(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => advancePhase.mutate({ roundId: params.roundId })}
              loading={advancePhase.isPending}
            >
              Advance
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          This will move the round from{" "}
          <span className="font-medium">{PHASE_LABELS[round.status]}</span> to
          the next phase. This cannot be undone.
        </p>
        {advancePhase.error && (
          <p className="mt-2 text-sm text-danger">
            {advancePhase.error.message}
          </p>
        )}
      </Modal>
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
          <div className="flex items-center gap-3 py-2 text-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted">
              <Music2 className="h-5 w-5 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Submission Phase</p>
              <p className="text-xs text-text-muted">
                <span className="font-medium">
                  {round.submissionCount}/{round.memberCount}
                </span>{" "}
                members have submitted
              </p>
            </div>
          </div>
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted">
                <ListMusic className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Listening Phase</p>
                <p className="text-xs text-text-muted">
                  Listen to all {round.submissions.length} tracks before voting
                  begins
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
                  <Button variant="primary" size="sm">
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
