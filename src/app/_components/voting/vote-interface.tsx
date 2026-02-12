"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquare,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
} from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";

interface Submission {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string;
  spotifyTrackId: string;
  previewUrl?: string | null;
  trackDurationMs?: number;
  isOwn: boolean;
}

interface VoteInterfaceProps {
  roundId: string;
  submissions: Submission[];
  upvotePointsPerRound: number;
  allowDownvotes: boolean;
  downvotePointValue: number;
  memberCount: number;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function TrackPreviewPlayer({
  url,
  trackId,
  activeTrackId,
  onPlay,
}: {
  url: string;
  trackId: string;
  activeTrackId: string | null;
  onPlay: (trackId: string | null) => void;
}) {
  const audioRef = useCallback(
    (node: HTMLAudioElement | null) => {
      if (node && activeTrackId !== trackId && !node.paused) {
        node.pause();
      }
    },
    [activeTrackId, trackId],
  );

  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const isPlaying = activeTrackId === trackId;

  const setRef = useCallback(
    (node: HTMLAudioElement | null) => {
      setAudioEl(node);
      audioRef(node);
    },
    [audioRef],
  );

  const toggle = () => {
    if (!audioEl) return;
    if (isPlaying) {
      audioEl.pause();
      onPlay(null);
    } else {
      void audioEl.play();
      onPlay(trackId);
    }
  };

  return (
    <>
      <audio ref={setRef} src={url} onEnded={() => onPlay(null)} preload="none" />
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="ml-0.5 h-3.5 w-3.5" />
        )}
      </button>
    </>
  );
}

export function VoteInterface({
  roundId,
  submissions,
  upvotePointsPerRound,
  allowDownvotes,
  downvotePointValue,
  memberCount: _memberCount,
}: VoteInterfaceProps) {
  const utils = api.useUtils();

  const { data: myVotesData } = api.vote.getMyVotes.useQuery({ roundId });
  const { data: hasVotedData } = api.vote.hasVoted.useQuery({ roundId });

  const submitVotes = api.vote.submit.useMutation({
    onSuccess: () => {
      void utils.vote.getMyVotes.invalidate({ roundId });
      void utils.vote.hasVoted.invalidate({ roundId });
      setShowConfirm(false);
      setIsEditing(false);
    },
  });

  // Voteable submissions (exclude own)
  const voteableSubmissions = useMemo(
    () => submissions.filter((s) => !s.isOwn),
    [submissions],
  );

  // State
  const [points, setPoints] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  const hasVoted = hasVotedData?.hasVoted ?? false;

  // Initialize from existing votes
  useEffect(() => {
    if (myVotesData && hasVoted && !isEditing) {
      const votesMap: Record<string, number> = {};
      for (const v of myVotesData.votes) {
        votesMap[v.submissionId] = v.points;
      }
      setPoints(votesMap);

      const commentsMap: Record<string, string> = {};
      for (const c of myVotesData.comments) {
        commentsMap[c.submissionId] = c.text;
      }
      setComments(commentsMap);
    }
  }, [myVotesData, hasVoted, isEditing]);

  // Point calculations
  const totalPositive = useMemo(
    () =>
      Object.values(points).reduce(
        (sum, p) => sum + Math.max(0, p),
        0,
      ),
    [points],
  );

  const pointsRemaining = upvotePointsPerRound - totalPositive;
  const isValidAllocation = pointsRemaining === 0;

  const updatePoints = (submissionId: string, delta: number) => {
    setPoints((prev) => {
      const current = prev[submissionId] ?? 0;
      const newVal = current + delta;
      const minPoints = allowDownvotes ? downvotePointValue : 0;

      if (newVal < minPoints || newVal > upvotePointsPerRound) return prev;

      // Check if adding positive points would exceed budget
      if (delta > 0 && newVal > 0) {
        const currentPositive = Math.max(0, current);
        const newPositive = Math.max(0, newVal);
        const positiveIncrease = newPositive - currentPositive;
        if (totalPositive + positiveIncrease > upvotePointsPerRound) return prev;
      }

      return { ...prev, [submissionId]: newVal };
    });
  };

  const handleSubmit = () => {
    const votesPayload = voteableSubmissions.map((sub) => ({
      submissionId: sub.id,
      points: points[sub.id] ?? 0,
    }));

    const commentsPayload = voteableSubmissions
      .filter((sub) => (comments[sub.id] ?? "").trim().length > 0)
      .map((sub) => ({
        submissionId: sub.id,
        text: comments[sub.id]!,
      }));

    submitVotes.mutate({
      roundId,
      votes: votesPayload,
      comments: commentsPayload,
    });
  };

  const startEditing = () => {
    setIsEditing(true);
    // Load existing votes into state
    if (myVotesData) {
      const votesMap: Record<string, number> = {};
      for (const v of myVotesData.votes) {
        votesMap[v.submissionId] = v.points;
      }
      setPoints(votesMap);

      const commentsMap: Record<string, string> = {};
      for (const c of myVotesData.comments) {
        commentsMap[c.submissionId] = c.text;
      }
      setComments(commentsMap);
    }
  };

  // Post-vote state
  if (hasVoted && !isEditing) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium">You&apos;ve voted!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your votes have been recorded for this round.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={startEditing}>
                Edit votes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show current allocations */}
        <Card>
          <CardHeader>
            <CardTitle>Your allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {voteableSubmissions
                .filter((sub) => (points[sub.id] ?? 0) !== 0)
                .sort((a, b) => (points[b.id] ?? 0) - (points[a.id] ?? 0))
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-2"
                  >
                    <Image
                      src={sub.albumArtUrl}
                      alt={sub.albumName}
                      width={36}
                      height={36}
                      className="rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{sub.trackName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sub.artistName}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        (points[sub.id] ?? 0) > 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {(points[sub.id] ?? 0) > 0 ? "+" : ""}
                      {points[sub.id]} pts
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Voting form
  return (
    <div className="space-y-4">
      {/* Points budget */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Points Budget</p>
              <p className="text-xs text-muted-foreground">
                Allocate all {upvotePointsPerRound} points to submit
              </p>
            </div>
            <div
              className={`rounded-lg px-3 py-1.5 text-sm font-mono font-semibold ${
                pointsRemaining === 0
                  ? "bg-success/20 text-success"
                  : pointsRemaining <= 3
                    ? "bg-warning/20 text-warning"
                    : "bg-destructive/20 text-destructive"
              }`}
            >
              {pointsRemaining} / {upvotePointsPerRound} remaining
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions to vote on */}
      <Card>
        <CardHeader>
          <CardTitle>Vote on {voteableSubmissions.length} tracks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {voteableSubmissions.map((sub) => {
              const currentPoints = points[sub.id] ?? 0;
              const commentText = comments[sub.id] ?? "";
              const isCommentExpanded = expandedComments.has(sub.id);

              return (
                <div
                  key={sub.id}
                  className="rounded-lg border border-border/50 p-3"
                >
                  {/* Track info row */}
                  <div className="flex items-center gap-3">
                    {sub.albumArtUrl ? (
                      <Image
                        src={sub.albumArtUrl}
                        alt={sub.albumName}
                        width={48}
                        height={48}
                        className="rounded"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <Music2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {sub.trackName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {sub.artistName} &middot; {sub.albumName}
                      </p>
                    </div>

                    {sub.trackDurationMs && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDuration(sub.trackDurationMs)}
                      </span>
                    )}

                    {sub.previewUrl && (
                      <TrackPreviewPlayer
                        url={sub.previewUrl}
                        trackId={sub.id}
                        activeTrackId={activeTrackId}
                        onPlay={setActiveTrackId}
                      />
                    )}

                    <a
                      href={`https://open.spotify.com/track/${sub.spotifyTrackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Open in Spotify"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Point allocation */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {allowDownvotes && (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() =>
                            updatePoints(
                              sub.id,
                              currentPoints > 0
                                ? -1
                                : currentPoints === 0
                                  ? downvotePointValue
                                  : 0,
                            )
                          }
                          disabled={currentPoints <= downvotePointValue}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                      {!allowDownvotes && (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updatePoints(sub.id, -1)}
                          disabled={currentPoints <= 0}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      )}

                      <span
                        className={`min-w-[3rem] text-center text-lg font-bold ${
                          currentPoints > 0
                            ? "text-success"
                            : currentPoints < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {currentPoints}
                      </span>

                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updatePoints(sub.id, 1)}
                        disabled={
                          currentPoints >= upvotePointsPerRound ||
                          pointsRemaining <= 0
                        }
                      >
                        {allowDownvotes ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => {
                          const next = new Set(prev);
                          if (next.has(sub.id)) next.delete(sub.id);
                          else next.add(sub.id);
                          return next;
                        })
                      }
                      className={`flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
                        commentText.length > 0
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {commentText.length > 0 ? "Comment added" : "Add comment"}
                    </button>
                  </div>

                  {/* Comment textarea */}
                  {isCommentExpanded && (
                    <div className="mt-2">
                      <Textarea
                        value={commentText}
                        onChange={(e) =>
                          setComments((prev) => ({
                            ...prev,
                            [sub.id]: e.target.value,
                          }))
                        }
                        maxLength={280}
                        rows={2}
                        placeholder="Leave a comment (optional)"
                        className="resize-none"
                      />
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        {commentText.length}/280
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <div className="flex flex-col items-center gap-2">
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={!isValidAllocation}
          size="lg"
          className="w-full"
        >
          Review &amp; Submit Votes
        </Button>
        {!isValidAllocation && (
          <p className="text-xs text-muted-foreground">
            Allocate all {upvotePointsPerRound} points to submit (
            {pointsRemaining} remaining)
          </p>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) setShowConfirm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Votes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              {voteableSubmissions
                .filter((sub) => (points[sub.id] ?? 0) !== 0)
                .sort((a, b) => (points[b.id] ?? 0) - (points[a.id] ?? 0))
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{sub.trackName}</span>
                    <span
                      className={`ml-2 font-semibold ${
                        (points[sub.id] ?? 0) > 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {(points[sub.id] ?? 0) > 0 ? "+" : ""}
                      {points[sub.id]} pts
                    </span>
                  </div>
                ))}
            </div>

            {voteableSubmissions.some(
              (sub) => (comments[sub.id] ?? "").trim().length > 0,
            ) && (
              <div className="border-t border-border pt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Comments:
                </p>
                {voteableSubmissions
                  .filter(
                    (sub) => (comments[sub.id] ?? "").trim().length > 0,
                  )
                  .map((sub) => (
                    <p key={sub.id} className="text-xs text-muted-foreground">
                      <span className="font-medium">{sub.trackName}:</span>{" "}
                      {comments[sub.id]}
                    </p>
                  ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              You cannot change votes after the voting phase ends.
            </p>

            {submitVotes.error && (
              <p className="text-sm text-destructive">{submitVotes.error.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Go Back
            </Button>
            <Button onClick={handleSubmit} loading={submitVotes.isPending}>
              Submit Votes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
