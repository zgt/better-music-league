"use client";

import { useParams, useRouter } from "next/navigation";
import { Users } from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export default function JoinLeague() {
  const params = useParams<{ inviteCode: string }>();
  const router = useRouter();

  const joinLeague = api.league.join.useMutation({
    onSuccess: (league) => {
      router.push(`/leagues/${league.id}`);
    },
  });

  const handleJoin = () => {
    joinLeague.mutate({ inviteCode: params.inviteCode });
  };

  // If already a member, the mutation will return CONFLICT — handle that
  const isAlreadyMember = joinLeague.error?.data?.code === "CONFLICT";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardContent>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
              <Users className="text-primary h-7 w-7" />
            </div>

            <div>
              <h1 className="text-xl font-bold">Join a League</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                You&apos;ve been invited to join a music league
              </p>
            </div>

            {joinLeague.error && !isAlreadyMember && (
              <p className="text-destructive text-sm">
                {joinLeague.error.message}
              </p>
            )}

            {isAlreadyMember ? (
              <p className="text-muted-foreground text-sm">
                You&apos;re already a member of this league.
              </p>
            ) : (
              <Button
                onClick={handleJoin}
                loading={joinLeague.isPending}
                className="w-full"
              >
                Join League
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
