"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, TicketCheck, Users, Clock, ArrowRight } from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FormInput } from "~/components/ui/form-input";
import { Skeleton } from "~/components/ui/skeleton";

const statusToBadgePhase = {
  SUBMISSION: "submission",
  LISTENING: "listening",
  VOTING: "voting",
  RESULTS: "results",
  COMPLETED: "results",
} as const;

function formatDeadline(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return "Overdue";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export default function Dashboard() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");

  const { data: leagues, isLoading } = api.league.getAll.useQuery();

  const joinLeague = api.league.join.useMutation({
    onSuccess: (league) => {
      router.push(`/leagues/${league.id}`);
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    joinLeague.mutate({ inviteCode: inviteCode.trim() });
  };

  // Collect upcoming deadlines from active rounds
  const deadlines =
    leagues
      ?.flatMap((league) =>
        league.rounds.map((round) => ({
          leagueId: league.id,
          leagueName: league.name,
          roundId: round.id,
          themeName: round.themeName,
          status: round.status,
          deadline:
            round.status === "SUBMISSION"
              ? new Date(round.submissionDeadline)
              : new Date(round.votingDeadline),
        })),
      )
      .filter((d) => d.deadline.getTime() > Date.now())
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Your Leagues</h1>
        <Button asChild>
          <Link href="/leagues/create">
            <Plus className="h-4 w-4" />
            Create League
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leagues grid */}
        <div className="space-y-4 lg:col-span-2">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-3 h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : leagues && leagues.length > 0 ? (
            <div className="space-y-4">
              {leagues.map((league) => {
                const activeRound = league.rounds[0];
                return (
                  <Link key={league.id} href={`/leagues/${league.id}`}>
                    <Card className="cursor-pointer transition-colors hover:border-border/80 hover:bg-accent">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{league.name}</h3>
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {league._count.members}
                              </span>
                              {activeRound && (
                                <span>
                                  {activeRound.themeName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeRound && (
                              <Badge variant={statusToBadgePhase[activeRound.status as keyof typeof statusToBadgePhase] ?? "results"}>
                                {(statusToBadgePhase[activeRound.status as keyof typeof statusToBadgePhase] ?? "results").charAt(0).toUpperCase() + (statusToBadgePhase[activeRound.status as keyof typeof statusToBadgePhase] ?? "results").slice(1)}
                              </Badge>
                            )}
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <TicketCheck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">No leagues yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create one or join with an invite code.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Join League */}
          <Card>
            <CardHeader>
              <CardTitle>Join a League</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="flex flex-col gap-3">
                <FormInput
                  id="invite-code"
                  placeholder="Paste invite code..."
                  description="Get an invite code from a league admin"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
                {joinLeague.error && (
                  <p className="text-sm text-destructive">{joinLeague.error.message}</p>
                )}
                <Button
                  type="submit"
                  variant="secondary"
                  className="self-start"
                  loading={joinLeague.isPending}
                >
                  Join League
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          {deadlines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deadlines.map((d) => (
                    <Link
                      key={d.roundId}
                      href={`/leagues/${d.leagueId}`}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.themeName}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.leagueName} &middot; {d.status === "SUBMISSION" ? "Submit" : "Vote"} &middot;{" "}
                          {formatDeadline(d.deadline)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
