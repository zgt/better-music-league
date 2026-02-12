"use client";

import Image from "next/image";
import { Trophy } from "lucide-react";

import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import { Card } from "~/app/_components/ui/card";

export function LeagueStandings({ leagueId }: { leagueId: string }) {
  const { data: session } = authClient.useSession();
  const { data: standings, isLoading } = api.league.getStandings.useQuery({
    leagueId,
  });

  if (isLoading) {
    return (
      <Card header="Standings">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-bg-tertiary" />
          ))}
        </div>
      </Card>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <Card header="Standings">
        <p className="text-sm text-text-muted">No scored rounds yet.</p>
      </Card>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <Card header="Standings">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="pb-2 pr-2 font-medium">#</th>
              <th className="pb-2 font-medium">Player</th>
              <th className="pb-2 text-right font-medium">Points</th>
              <th className="hidden pb-2 text-right font-medium sm:table-cell">Wins</th>
              <th className="hidden pb-2 text-right font-medium sm:table-cell">Played</th>
              <th className="hidden pb-2 text-right font-medium md:table-cell">Avg</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, i) => {
              const isCurrentUser = entry.user.id === currentUserId;

              return (
                <tr
                  key={entry.user.id}
                  className={`border-b border-border/50 last:border-0 ${
                    isCurrentUser ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="py-2.5 pr-2">
                    {i === 0 && entry.totalPoints > 0 ? (
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <span className="text-text-muted">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {entry.user.image ? (
                        <Image
                          src={entry.user.image}
                          alt=""
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                          {entry.user.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className={isCurrentUser ? "font-semibold" : ""}>
                        {entry.user.name}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-text-muted">(you)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-medium">{entry.totalPoints}</td>
                  <td className="hidden py-2.5 text-right sm:table-cell">
                    {entry.roundsWon}
                  </td>
                  <td className="hidden py-2.5 text-right sm:table-cell">
                    {entry.roundsParticipated}
                  </td>
                  <td className="hidden py-2.5 text-right text-text-muted md:table-cell">
                    {entry.avgPointsPerRound}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
