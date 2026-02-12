"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FormInput } from "~/components/ui/form-input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormInput
              id="name"
              label="League Name"
              placeholder="e.g. Friday Vibes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="What's this league about?"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="songsPerRound">
                Songs per Round
              </Label>
              <Select
                value={String(songsPerRound)}
                onValueChange={(v) => setSongsPerRound(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormInput
              id="upvotePoints"
              label="Upvote Points per Round"
              description="Points each member can distribute per round (1-20)"
              type="number"
              min={1}
              max={20}
              value={upvotePointsPerRound}
              onChange={(e) => setUpvotePointsPerRound(Number(e.target.value))}
            />

            <div className="flex items-center gap-3">
              <Checkbox
                id="allow-downvotes"
                checked={allowDownvotes}
                onCheckedChange={(v) => setAllowDownvotes(v === true)}
              />
              <Label htmlFor="allow-downvotes">Allow downvotes</Label>
            </div>

            {createLeague.error && (
              <p className="text-sm text-destructive">{createLeague.error.message}</p>
            )}

            <Button type="submit" loading={createLeague.isPending}>
              Create League
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
