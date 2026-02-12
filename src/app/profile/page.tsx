"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Star, Users, Music, Settings } from "lucide-react";

import { api } from "~/trpc/react";
import { Card } from "../_components/ui/card";
import { Button } from "../_components/ui/button";

export default function ProfilePage() {
  const { data: profile, isLoading } = api.user.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-bg-tertiary" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-bg-tertiary" />
              <div className="h-4 w-56 rounded bg-bg-tertiary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <Image
              src={profile.image}
              alt=""
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-bold">
              {profile.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-text-muted">{profile.email}</p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="secondary" size="sm">
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex flex-col items-center gap-1 text-center">
            <Star className="h-5 w-5 text-accent" />
            <p className="text-2xl font-bold">{profile.stats.totalPoints}</p>
            <p className="text-xs text-text-muted">Total Points</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center gap-1 text-center">
            <Trophy className="h-5 w-5 text-warning" />
            <p className="text-2xl font-bold">{profile.stats.roundsWon}</p>
            <p className="text-xs text-text-muted">Rounds Won</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center gap-1 text-center">
            <Users className="h-5 w-5 text-success" />
            <p className="text-2xl font-bold">{profile.stats.leaguesActive}</p>
            <p className="text-xs text-text-muted">Leagues Active</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center gap-1 text-center">
            <Music className="h-5 w-5 text-text-secondary" />
            <p className="text-2xl font-bold">
              {profile.stats.submissionsMade}
            </p>
            <p className="text-xs text-text-muted">Submissions</p>
          </div>
        </Card>
      </div>

      {/* Favorite submission */}
      {profile.favoriteSubmission && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-text-muted">
            Best Submission
          </h2>
          <Card>
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
                <p className="truncate text-sm text-text-muted">
                  {profile.favoriteSubmission.artistName}
                </p>
                <p className="text-xs text-text-muted">
                  {profile.favoriteSubmission.themeName} &middot;{" "}
                  {profile.favoriteSubmission.leagueName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-accent">
                  {profile.favoriteSubmission.points}
                </p>
                <p className="text-xs text-text-muted">pts</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      {profile.recentActivity.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-text-muted">
            Recent Activity
          </h2>
          <Card noPadding>
            <div className="divide-y divide-border">
              {profile.recentActivity.map((activity) => (
                <div
                  key={activity.roundId}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {activity.themeName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {activity.leagueName}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {activity.points} pts
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
