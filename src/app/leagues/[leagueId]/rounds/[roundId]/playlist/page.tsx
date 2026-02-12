"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  ExternalLink,
  ListMusic,
  Music2,
} from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const params = useParams<{ leagueId: string; roundId: string }>();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = api.round.getPlaylistTracks.useQuery({
    roundId: params.roundId,
  });

  const handleCopyAll = async () => {
    if (!data?.tracks) return;
    const links = data.tracks
      .map((t) => `https://open.spotify.com/track/${t.spotifyTrackId}`)
      .join("\n");
    await navigator.clipboard.writeText(links);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Music2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">
            Playlist not available
          </p>
          <Link
            href={`/leagues/${params.leagueId}/rounds/${params.roundId}`}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Back to round
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href={`/leagues/${params.leagueId}/rounds/${params.roundId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to round
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Round {data.roundNumber} Playlist
        </p>
        <h1 className="mt-1 text-2xl font-bold">{data.themeName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.tracks.length} tracks
        </p>
      </div>

      {/* Action buttons */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleCopyAll}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <ClipboardCopy className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy all track links"}
            </Button>

            {data.playlistUrl && (
              <Button size="sm" asChild>
                <a
                  href={data.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Spotify Playlist
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Track list with embeds */}
      <div className="space-y-4">
        {data.tracks.map((track) => (
          <Card key={track.id}>
            <CardContent className="pt-6">
              {/* Track info row */}
              <div className="mb-3 flex items-center gap-3">
                {track.albumArtUrl ? (
                  <Image
                    src={track.albumArtUrl}
                    alt={track.albumName}
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
                    {track.trackName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {track.artistName} &middot; {track.albumName}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDuration(track.trackDurationMs)}
                </span>

                <a
                  href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Open in Spotify"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Spotify embed */}
              <iframe
                src={`https://open.spotify.com/embed/track/${track.spotifyTrackId}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
                title={`${track.trackName} by ${track.artistName}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual playlist instructions */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <ListMusic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Create your own playlist</p>
              <p className="mt-1 text-xs text-muted-foreground">
                To save these tracks as a Spotify playlist: open Spotify, create a
                new playlist, then use &ldquo;Copy all track links&rdquo; above
                and search for each track to add it. Or, click each
                track&apos;s Spotify link and add it to your playlist from there.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
