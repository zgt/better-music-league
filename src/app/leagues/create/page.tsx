"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "~/app/_components/ui/card";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { api } from "~/trpc/react";

export default function CreateLeague() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [songsPerRound, setSongsPerRound] = useState(1);
  const [allowDownvotes, setAllowDownvotes] = useState(false);
  const [upvotePointsPerRound, setUpvotePointsPerRound] = useState(10);

  const createLeague = api.league.create.useMutation({
    onSuccess: (league) => {
      router.push(`/leagues/${league.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeague.mutate({
      name,
      description: description || undefined,
      songsPerRound,
      allowDownvotes,
      upvotePointsPerRound,
    });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create a League</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            id="name"
            label="League Name"
            placeholder="e.g. Friday Vibes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-text-primary">
              Description
            </label>
            <textarea
              id="description"
              className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="What's this league about?"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="songsPerRound" className="text-sm font-medium text-text-primary">
              Songs per Round
            </label>
            <select
              id="songsPerRound"
              className="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              value={songsPerRound}
              onChange={(e) => setSongsPerRound(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="upvotePoints" className="text-sm font-medium text-text-primary">
              Upvote Points per Round
            </label>
            <Input
              id="upvotePoints"
              type="number"
              min={1}
              max={20}
              value={upvotePointsPerRound}
              onChange={(e) => setUpvotePointsPerRound(Number(e.target.value))}
            />
            <p className="text-sm text-text-muted">
              Points each member can distribute per round (1-20)
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allowDownvotes}
              onChange={(e) => setAllowDownvotes(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-bg-tertiary accent-accent"
            />
            <span className="text-sm text-text-primary">Allow downvotes</span>
          </label>

          {createLeague.error && (
            <p className="text-sm text-danger">{createLeague.error.message}</p>
          )}

          <Button type="submit" loading={createLeague.isPending}>
            Create League
          </Button>
        </form>
      </Card>
    </div>
  );
}
