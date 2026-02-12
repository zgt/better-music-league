"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Star, Users, Music, Settings } from "lucide-react";

import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";

export default function ProfilePage() {
  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground font-medium">
            Unable to load profile
          </p>
          <Link
            href="/dashboard"
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.image ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {profile.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-1 text-center">
              <Star className="text-primary h-5 w-5" />
              <p className="text-2xl font-bold">{profile.stats.totalPoints}</p>
              <p className="text-muted-foreground text-xs">Total Points</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-1 text-center">
              <Trophy className="text-warning h-5 w-5" />
              <p className="text-2xl font-bold">{profile.stats.roundsWon}</p>
              <p className="text-muted-foreground text-xs">Rounds Won</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-1 text-center">
              <Users className="text-success h-5 w-5" />
              <p className="text-2xl font-bold">
                {profile.stats.leaguesActive}
              </p>
              <p className="text-muted-foreground text-xs">Leagues Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-1 text-center">
              <Music className="text-muted-foreground h-5 w-5" />
              <p className="text-2xl font-bold">
                {profile.stats.submissionsMade}
              </p>
              <p className="text-muted-foreground text-xs">Submissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Favorite submission */}
      {profile.favoriteSubmission && (
        <div className="mb-8">
          <h2 className="text-muted-foreground mb-3 text-sm font-medium">
            Best Submission
          </h2>
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <Image
                  src={profile.favoriteSubmission.albumArtUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {profile.favoriteSubmission.trackName}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {profile.favoriteSubmission.artistName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {profile.favoriteSubmission.themeName} &middot;{" "}
                    {profile.favoriteSubmission.leagueName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary text-lg font-bold">
                    {profile.favoriteSubmission.points}
                  </p>
                  <p className="text-muted-foreground text-xs">pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      {profile.recentActivity.length > 0 && (
        <div>
          <h2 className="text-muted-foreground mb-3 text-sm font-medium">
            Recent Activity
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-border divide-y">
                {profile.recentActivity.map((activity) => (
                  <div
                    key={activity.roundId}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {activity.themeName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {activity.leagueName}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {activity.points} pts
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
