"use client";

import { Trophy } from "lucide-react";

import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";

export function LeagueStandings({ leagueId }: { leagueId: string }) {
  const { data: session } = authClient.useSession();
  const { data: standings, isLoading } = api.league.getStandings.useQuery({
    leagueId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Trophy className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No scored rounds yet. Standings will appear after the first round
              is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border text-left text-muted-foreground">
                <TableHead className="pb-2 pr-2 font-medium">#</TableHead>
                <TableHead className="pb-2 font-medium">Player</TableHead>
                <TableHead className="pb-2 text-right font-medium">
                  Points
                </TableHead>
                <TableHead className="hidden pb-2 text-right font-medium sm:table-cell">
                  Wins
                </TableHead>
                <TableHead className="hidden pb-2 text-right font-medium sm:table-cell">
                  Played
                </TableHead>
                <TableHead className="hidden pb-2 text-right font-medium md:table-cell">
                  Avg
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((entry, i) => {
                const isCurrentUser = entry.user.id === currentUserId;

                return (
                  <TableRow
                    key={entry.user.id}
                    className={`border-b border-border/50 last:border-0 ${
                      isCurrentUser ? "bg-primary/5" : ""
                    }`}
                  >
                    <TableCell className="py-2.5 pr-2">
                      {i === 0 && entry.totalPoints > 0 ? (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={entry.user.image ?? undefined}
                          />
                          <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                            {entry.user.name?.charAt(0).toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className={isCurrentUser ? "font-semibold" : ""}>
                          {entry.user.name}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-medium">
                      {entry.totalPoints}
                    </TableCell>
                    <TableCell className="hidden py-2.5 text-right sm:table-cell">
                      {entry.roundsWon}
                    </TableCell>
                    <TableCell className="hidden py-2.5 text-right sm:table-cell">
                      {entry.roundsParticipated}
                    </TableCell>
                    <TableCell className="hidden py-2.5 text-right text-muted-foreground md:table-cell">
                      {entry.avgPointsPerRound}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
