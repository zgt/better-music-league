"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  Trophy,
} from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

type ResultEntry = {
  submission: {
    id: string;
    trackName: string;
    artistName: string;
    albumName: string;
    albumArtUrl: string;
    spotifyTrackId: string;
    previewUrl: string | null;
    trackDurationMs: number;
  };
  submitter: { id: string; name: string; image: string | null };
  totalPoints: number;
  votes: {
    voter: { id: string; name: string; image: string | null };
    points: number;
  }[];
  comments: {
    commenter: { id: string; name: string; image: string | null };
    text: string;
  }[];
};

const RANK_STYLES = [
  {
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    text: "text-yellow-500",
    label: "1st",
  },
  {
    bg: "bg-gray-300/15",
    border: "border-gray-300/30",
    text: "text-gray-300",
    label: "2nd",
  },
  {
    bg: "bg-amber-700/15",
    border: "border-amber-700/30",
    text: "text-amber-700",
    label: "3rd",
  },
];

export function RoundResults({ roundId }: { roundId: string }) {
  const { data: results, isLoading } = api.vote.getResults.useQuery({
    roundId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="bg-muted h-40 rounded-xl" />
          <div className="bg-muted h-24 rounded-xl" />
          <div className="bg-muted h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No results available for this round.
          </p>
        </CardContent>
      </Card>
    );
  }

  const podium = results.slice(0, 3);
  const rest = results.slice(3);

  return (
    <div className="space-y-6">
      {/* Winner announcement */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-500">
          <Trophy className="h-4 w-4" />
          {results[0]!.submitter.name} wins the round!
        </div>
      </div>

      {/* Podium */}
      <div className="grid gap-3">
        {podium.map((entry, i) => (
          <PodiumCard key={entry.submission.id} entry={entry} rank={i} />
        ))}
      </div>

      {/* Full results */}
      {rest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Full Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rest.map((entry, i) => (
                <ResultRow
                  key={entry.submission.id}
                  entry={entry}
                  rank={i + 3}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PodiumCard({ entry, rank }: { entry: ResultEntry; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 0);
  const style = RANK_STYLES[rank] ?? RANK_STYLES[2]!;
  const isWinner = rank === 0;

  return (
    <div
      className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${style.text} ${isWinner ? "text-lg" : "text-sm"}`}
            style={{
              background: isWinner
                ? "linear-gradient(135deg, rgba(234,179,8,0.3), rgba(234,179,8,0.1))"
                : undefined,
            }}
          >
            {rank + 1}
          </div>

          {/* Album art */}
          <Image
            src={entry.submission.albumArtUrl}
            alt={entry.submission.albumName}
            width={isWinner ? 80 : 60}
            height={isWinner ? 80 : 60}
            className="shrink-0 rounded-lg shadow-md"
          />

          {/* Track info */}
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold ${isWinner ? "text-lg" : "text-base"}`}
            >
              {entry.submission.trackName}
            </p>
            <p className="text-muted-foreground text-sm">
              {entry.submission.artistName}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Submitter user={entry.submitter} />
              <a
                href={`https://open.spotify.com/track/${entry.submission.spotifyTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                Spotify
              </a>
            </div>
          </div>

          {/* Points */}
          <div className="text-right">
            <p
              className={`font-bold ${style.text} ${isWinner ? "text-2xl" : "text-xl"}`}
            >
              {entry.totalPoints}
            </p>
            <p className="text-muted-foreground text-xs">pts</p>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="border-border/30 text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1 border-t py-2 text-xs transition-colors"
      >
        {expanded ? (
          <>
            Hide details <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Show votes & comments <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {expanded && <VoteAndCommentDetails entry={entry} />}
    </div>
  );
}

function ResultRow({ entry, rank }: { entry: ResultEntry; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-border/50 rounded-lg border">
      <div className="flex items-center gap-3 p-3">
        <span className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {rank + 1}
        </span>
        <Image
          src={entry.submission.albumArtUrl}
          alt={entry.submission.albumName}
          width={40}
          height={40}
          className="shrink-0 rounded"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {entry.submission.trackName}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {entry.submission.artistName}
            {" \u00b7 "}
            {entry.submitter.name}
          </p>
        </div>
        <span className="text-sm font-semibold">{entry.totalPoints} pts</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {expanded && <VoteAndCommentDetails entry={entry} />}
    </div>
  );
}

function VoteAndCommentDetails({ entry }: { entry: ResultEntry }) {
  const sortedVotes = [...entry.votes].sort((a, b) => b.points - a.points);
  const hasComments = entry.comments.length > 0;

  return (
    <div className="border-border/30 border-t px-4 py-3">
      {/* Votes */}
      <div className="mb-3">
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          Votes
        </p>
        <div className="flex flex-wrap gap-2">
          {sortedVotes.map((v) => (
            <div
              key={v.voter.id}
              className="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={v.voter.image ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                  {v.voter.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{v.voter.name}</span>
              <span
                className={`text-xs font-bold ${
                  v.points > 0
                    ? "text-success"
                    : v.points < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {v.points > 0 ? `+${v.points}` : v.points}
              </span>
            </div>
          ))}
          {sortedVotes.length === 0 && (
            <p className="text-muted-foreground text-xs">No votes received</p>
          )}
        </div>
      </div>

      {/* Comments */}
      {hasComments && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
            <MessageCircle className="mr-1 inline h-3 w-3" />
            Comments
          </p>
          <div className="space-y-2">
            {entry.comments.map((c) => (
              <div key={c.commenter.id} className="flex gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={c.commenter.image ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                    {c.commenter.name?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium">
                    {c.commenter.name}
                  </span>
                  <p className="text-muted-foreground text-xs">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Submitter({ user }: { user: { name: string; image: string | null } }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
      <Avatar className="h-4 w-4">
        <AvatarImage src={user.image ?? undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
          {user.name?.charAt(0).toUpperCase() ?? "?"}
        </AvatarFallback>
      </Avatar>
      {user.name}
    </span>
  );
}
