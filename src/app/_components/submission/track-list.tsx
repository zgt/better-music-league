"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, Music2, Pause, Play } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface TrackItem {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string;
  spotifyTrackId: string;
  previewUrl: string | null;
  trackDurationMs: number;
  isOwn: boolean;
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlaying = activeTrackId === trackId;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      onPlay(null);
    } else {
      void audio.play();
      onPlay(trackId);
    }
  };

  // Pause if another track starts playing
  if (!isPlaying && audioRef.current && !audioRef.current.paused) {
    audioRef.current.pause();
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => onPlay(null)}
        preload="none"
      />
      <button
        type="button"
        onClick={toggle}
        className="bg-primary hover:bg-primary/90 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors"
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

export function TrackList({ tracks }: { tracks: TrackItem[] }) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Music2 className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No tracks submitted yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`Playlist (${tracks.length} tracks)`}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="border-border/50 flex items-center gap-3 rounded-lg border p-3"
            >
              {track.albumArtUrl ? (
                <Image
                  src={track.albumArtUrl}
                  alt={track.albumName}
                  width={48}
                  height={48}
                  className="rounded"
                />
              ) : (
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
                  <Music2 className="text-muted-foreground h-5 w-5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {track.trackName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {track.artistName} &middot; {track.albumName}
                </p>
              </div>

              <span className="text-muted-foreground shrink-0 text-xs">
                {formatDuration(track.trackDurationMs)}
              </span>

              {track.previewUrl && (
                <TrackPreviewPlayer
                  url={track.previewUrl}
                  trackId={track.id}
                  activeTrackId={activeTrackId}
                  onPlay={setActiveTrackId}
                />
              )}

              <a
                href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                title="Open in Spotify"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {track.isOwn && (
                <span className="text-muted-foreground text-xs">(yours)</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
