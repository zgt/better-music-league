"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Music2, Play, Pause, Search, Trash2, X } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/app/_components/ui/button";
import { Card } from "~/app/_components/ui/card";

interface SubmitSongProps {
  roundId: string;
  songsPerRound: number;
}

interface Track {
  spotifyTrackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
  trackDurationMs: number;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function PreviewPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
    setPlaying(!playing);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover"
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" />
        )}
      </button>
    </>
  );
}

export function SubmitSong({ roundId, songsPerRound }: SubmitSongProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showResults, setShowResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: searchResults, isFetching: isSearching } =
    api.spotify.search.useQuery(
      { query: debouncedQuery, limit: 8 },
      { enabled: debouncedQuery.length > 0 },
    );

  const { data: mySubmissions } = api.submission.getMySubmissions.useQuery({
    roundId,
  });

  const submitMutation = api.submission.create.useMutation({
    onSuccess: () => {
      setSelectedTrack(null);
      setQuery("");
      setDebouncedQuery("");
      void utils.submission.getMySubmissions.invalidate({ roundId });
      void utils.submission.getCount.invalidate({ roundId });
      void utils.round.getById.invalidate({ roundId });
    },
  });

  const deleteMutation = api.submission.delete.useMutation({
    onSuccess: () => {
      void utils.submission.getMySubmissions.invalidate({ roundId });
      void utils.submission.getCount.invalidate({ roundId });
      void utils.round.getById.invalidate({ roundId });
    },
  });

  const submissionCount = mySubmissions?.length ?? 0;
  const canSubmit = submissionCount < songsPerRound;

  function handleSelect(track: Track) {
    setSelectedTrack(track);
    setShowResults(false);
    setQuery("");
    setDebouncedQuery("");
  }

  function handleSubmit() {
    if (!selectedTrack) return;
    submitMutation.mutate({
      roundId,
      spotifyTrackId: selectedTrack.spotifyTrackId,
      trackName: selectedTrack.trackName,
      artistName: selectedTrack.artistName,
      albumName: selectedTrack.albumName,
      albumArtUrl: selectedTrack.albumArtUrl ?? "",
      previewUrl: selectedTrack.previewUrl,
      trackDurationMs: selectedTrack.trackDurationMs,
    });
  }

  return (
    <div className="space-y-4">
      {/* My submissions */}
      {mySubmissions && mySubmissions.length > 0 && (
        <Card header={`Your Submissions (${submissionCount}/${songsPerRound})`}>
          <div className="space-y-3">
            {mySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
              >
                {sub.albumArtUrl && (
                  <Image
                    src={sub.albumArtUrl}
                    alt={sub.albumName}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {sub.trackName}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {sub.artistName} &middot; {sub.albumName}
                  </p>
                </div>
                <span className="text-xs text-text-muted">
                  {formatDuration(sub.trackDurationMs)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate({ submissionId: sub.id })}
                  loading={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search + submit interface */}
      {canSubmit && !selectedTrack && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-accent" />
              <p className="text-sm font-medium">Search for a song</p>
            </div>

            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search Spotify for a track..."
                  className="w-full rounded-lg border border-border bg-bg-tertiary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Search results dropdown */}
              {showResults && debouncedQuery.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-bg-secondary shadow-lg">
                  {isSearching && (
                    <div className="px-4 py-3 text-sm text-text-muted">
                      Searching...
                    </div>
                  )}
                  {!isSearching && searchResults?.length === 0 && (
                    <div className="px-4 py-3 text-sm text-text-muted">
                      No results found
                    </div>
                  )}
                  {searchResults?.map((track) => (
                    <button
                      key={track.spotifyTrackId}
                      type="button"
                      onClick={() => handleSelect(track)}
                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-tertiary"
                    >
                      {track.albumArtUrl ? (
                        <Image
                          src={track.albumArtUrl}
                          alt={track.albumName}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-bg-tertiary">
                          <Music2 className="h-4 w-4 text-text-muted" />
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Selected track confirmation */}
      {selectedTrack && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {selectedTrack.albumArtUrl ? (
                <Image
                  src={selectedTrack.albumArtUrl}
                  alt={selectedTrack.albumName}
                  width={120}
                  height={120}
                  className="rounded-lg"
                />
              ) : (
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-lg bg-bg-tertiary">
                  <Music2 className="h-8 w-8 text-text-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-lg font-semibold">{selectedTrack.trackName}</p>
                <p className="text-sm text-text-muted">
                  {selectedTrack.artistName}
                </p>
                <p className="text-sm text-text-muted">
                  {selectedTrack.albumName}
                </p>
                <p className="text-xs text-text-muted">
                  {formatDuration(selectedTrack.trackDurationMs)}
                </p>
                {selectedTrack.previewUrl && (
                  <div className="pt-1">
                    <PreviewPlayer url={selectedTrack.previewUrl} />
                  </div>
                )}
              </div>
            </div>

            {submitMutation.error && (
              <p className="text-sm text-danger">
                {submitMutation.error.message}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                loading={submitMutation.isPending}
              >
                Submit
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedTrack(null)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* All slots filled message */}
      {!canSubmit && mySubmissions && mySubmissions.length > 0 && !selectedTrack && (
        <p className="text-center text-sm text-text-muted">
          You&apos;ve submitted all {songsPerRound} song(s) for this round.
        </p>
      )}
    </div>
  );
}
