"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Music2, Play, Pause, Search, Trash2, X } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

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
        className="bg-primary hover:bg-primary/90 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors"
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="ml-0.5 h-3.5 w-3.5" />
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
        <Card>
          <CardHeader>
            <CardTitle>
              Your Submissions ({submissionCount}/{songsPerRound})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="border-border/50 flex items-center gap-3 rounded-lg border p-3"
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
                    <p className="text-muted-foreground truncate text-xs">
                      {sub.artistName} &middot; {sub.albumName}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDuration(sub.trackDurationMs)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteMutation.mutate({ submissionId: sub.id })
                    }
                    loading={deleteMutation.isPending}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + submit interface */}
      {canSubmit && !selectedTrack && (
        <Card>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Music2 className="text-primary h-5 w-5" />
                <p className="text-sm font-medium">Search for a song</p>
              </div>

              <div ref={dropdownRef} className="relative">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search Spotify for a track..."
                    className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors focus:outline-none focus-visible:ring-1"
                  />
                </div>

                {/* Search results dropdown */}
                {showResults && debouncedQuery.length > 0 && (
                  <div className="border-border bg-card absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border shadow-lg">
                    {isSearching && (
                      <div className="text-muted-foreground px-4 py-3 text-sm">
                        Searching...
                      </div>
                    )}
                    {!isSearching && searchResults?.length === 0 && (
                      <div className="text-muted-foreground px-4 py-3 text-sm">
                        No results found
                      </div>
                    )}
                    {searchResults?.map((track) => (
                      <button
                        key={track.spotifyTrackId}
                        type="button"
                        onClick={() => handleSelect(track)}
                        className="hover:bg-muted flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors"
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
                          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
                            <Music2 className="text-muted-foreground h-4 w-4" />
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected track confirmation */}
      {selectedTrack && (
        <Card>
          <CardContent>
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
                  <div className="bg-muted flex h-[120px] w-[120px] items-center justify-center rounded-lg">
                    <Music2 className="text-muted-foreground h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-lg font-semibold">
                    {selectedTrack.trackName}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedTrack.artistName}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {selectedTrack.albumName}
                  </p>
                  <p className="text-muted-foreground text-xs">
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
                <p className="text-destructive text-sm">
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
                <Button variant="ghost" onClick={() => setSelectedTrack(null)}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All slots filled message */}
      {!canSubmit &&
        mySubmissions &&
        mySubmissions.length > 0 &&
        !selectedTrack && (
          <p className="text-muted-foreground text-center text-sm">
            You&apos;ve submitted all {songsPerRound} song(s) for this round.
          </p>
        )}
    </div>
  );
}
