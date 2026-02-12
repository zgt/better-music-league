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
import { Card } from "~/app/_components/ui/card";
import { Button } from "~/app/_components/ui/button";

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-bg-tertiary" />
          <div className="h-4 w-72 rounded bg-bg-tertiary" />
          <div className="h-64 rounded-xl bg-bg-tertiary" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
            <Music2 className="h-6 w-6 text-text-muted" />
          </div>
          <p className="font-medium text-text-secondary">
            Playlist not available
          </p>
          <Link
            href={`/leagues/${params.leagueId}/rounds/${params.roundId}`}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
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
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to round
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-text-muted">
          Round {data.roundNumber} Playlist
        </p>
        <h1 className="mt-1 text-2xl font-bold">{data.themeName}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {data.tracks.length} tracks
        </p>
      </div>

      {/* Action buttons */}
      <Card className="mb-6">
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
            <a
              href={data.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="sm">
                <ExternalLink className="h-4 w-4" />
                Open Spotify Playlist
              </Button>
            </a>
          )}
        </div>
      </Card>

      {/* Track list with embeds */}
      <div className="space-y-4">
        {data.tracks.map((track) => (
          <Card key={track.id}>
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
                <div className="flex h-12 w-12 items-center justify-center rounded bg-bg-tertiary">
                  <Music2 className="h-5 w-5 text-text-muted" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {track.trackName}
                </p>
                <p className="truncate text-xs text-text-muted">
                  {track.artistName} &middot; {track.albumName}
                </p>
              </div>

              <span className="shrink-0 text-xs text-text-muted">
                {formatDuration(track.trackDurationMs)}
              </span>

              <a
                href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
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
          </Card>
        ))}
      </div>

      {/* Manual playlist instructions */}
      <Card className="mt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted">
            <ListMusic className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium">Create your own playlist</p>
            <p className="mt-1 text-xs text-text-muted">
              To save these tracks as a Spotify playlist: open Spotify, create a
              new playlist, then use &ldquo;Copy all track links&rdquo; above
              and search for each track to add it. Or, click each
              track&apos;s Spotify link and add it to your playlist from there.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
