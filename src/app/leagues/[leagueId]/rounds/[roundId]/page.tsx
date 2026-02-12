"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock, Music2 } from "lucide-react";

import { api } from "~/trpc/react";
import { Card } from "~/app/_components/ui/card";
import { Button } from "~/app/_components/ui/button";
import { Badge } from "~/app/_components/ui/badge";
import { Modal } from "~/app/_components/ui/modal";

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

  if (!round) return null;

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
      {canAdvance && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Admin Controls</p>
              <p className="text-xs text-text-muted">
                Manually advance the round to the next phase
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
    status: string;
    submissions: {
      id: string;
      trackName: string;
      artistName: string;
      albumName: string;
      albumArtUrl: string;
      spotifyTrackId: string;
      submitter: { id: string; name: string; image: string | null } | null;
      totalPoints: number;
      isOwn: boolean;
    }[];
    submissionCount: number;
    memberCount: number;
    leagueId: string;
  };
}) {
  if (round.status === "SUBMISSION") {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
            <Music2 className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="font-medium">Submission Phase</p>
            <p className="mt-1 text-sm text-text-muted">
              Waiting for submissions...{" "}
              <span className="font-medium">
                {round.submissionCount}/{round.memberCount}
              </span>{" "}
              submitted
            </p>
          </div>
          {round.submissions.some((s) => s.isOwn) ? (
            <p className="text-sm text-success">You&apos;ve submitted!</p>
          ) : (
            <p className="text-sm text-text-muted">
              Submission form coming in Phase 6
            </p>
          )}
        </div>
      </Card>
    );
  }

  if (round.status === "LISTENING" || round.status === "VOTING") {
    return (
      <Card header={round.status === "LISTENING" ? "Playlist" : "Tracks"}>
        {round.submissions.length > 0 ? (
          <div className="space-y-3">
            {round.submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
              >
                <Image
                  src={sub.albumArtUrl}
                  alt={sub.albumName}
                  width={48}
                  height={48}
                  className="rounded"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {sub.trackName}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {sub.artistName} &middot; {sub.albumName}
                  </p>
                </div>
                {sub.isOwn && (
                  <span className="text-xs text-text-muted">(yours)</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No submissions yet.</p>
        )}
        {round.status === "VOTING" && (
          <p className="mt-4 text-center text-sm text-text-muted">
            Voting interface coming in Phase 7
          </p>
        )}
      </Card>
    );
  }

  // RESULTS or COMPLETED
  return (
    <Card header="Results">
      {round.submissions.length > 0 ? (
        <div className="space-y-3">
          {[...round.submissions]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((sub, i) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0
                      ? "bg-warning/20 text-warning"
                      : "bg-bg-tertiary text-text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <Image
                  src={sub.albumArtUrl}
                  alt={sub.albumName}
                  width={48}
                  height={48}
                  className="rounded"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {sub.trackName}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {sub.artistName}
                    {sub.submitter && (
                      <> &middot; submitted by {sub.submitter.name}</>
                    )}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {sub.totalPoints} pts
                </span>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No submissions in this round.</p>
      )}
    </Card>
  );
}
