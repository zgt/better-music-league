import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const notificationPreferencesSchema = z.object({
  roundStart: z.boolean(),
  submissionDeadline: z.boolean(),
  votingOpen: z.boolean(),
  resultsAvailable: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

const defaultNotificationPreferences: NotificationPreferences = {
  roundStart: true,
  submissionDeadline: true,
  votingOpen: true,
  resultsAvailable: true,
};

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        notificationPreferences: true,
        accounts: {
          select: {
            providerId: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Leagues joined
    const leagueCount = await ctx.db.leagueMember.count({
      where: { userId },
    });

    // Total points earned (sum of votes received on user's submissions)
    const pointsResult = await ctx.db.vote.aggregate({
      _sum: { points: true },
      where: { submission: { userId } },
    });
    const totalPoints = pointsResult._sum.points ?? 0;

    // Rounds participated (rounds where user has a submission)
    const roundsParticipated = await ctx.db.submission.groupBy({
      by: ["roundId"],
      where: { userId },
    });

    // Rounds won — find rounds where user scored highest
    const scoredRounds = await ctx.db.round.findMany({
      where: {
        status: { in: ["RESULTS", "COMPLETED"] },
        submissions: { some: { userId } },
      },
      include: {
        submissions: {
          include: { votes: { select: { points: true } } },
        },
      },
    });

    let roundsWon = 0;
    for (const round of scoredRounds) {
      const scoresByUser = new Map<string, number>();
      for (const sub of round.submissions) {
        const pts = sub.votes.reduce((sum, v) => sum + v.points, 0);
        scoresByUser.set(
          sub.userId,
          (scoresByUser.get(sub.userId) ?? 0) + pts,
        );
      }
      const maxScore = Math.max(...scoresByUser.values());
      if (maxScore > 0 && scoresByUser.get(userId) === maxScore) {
        roundsWon++;
      }
    }

    // Submissions made
    const submissionCount = await ctx.db.submission.count({
      where: { userId },
    });

    // Favorite submission (most points ever received on a single track)
    const topSubmission = await ctx.db.submission.findFirst({
      where: { userId },
      include: {
        votes: { select: { points: true } },
        round: { select: { themeName: true, league: { select: { name: true } } } },
      },
      orderBy: { votes: { _count: "desc" } },
    });

    let favoriteSubmission: {
      trackName: string;
      artistName: string;
      albumArtUrl: string;
      points: number;
      themeName: string;
      leagueName: string;
    } | null = null;

    if (topSubmission) {
      // We need to find submission with max total points, not just vote count
      const allSubmissions = await ctx.db.submission.findMany({
        where: { userId },
        include: {
          votes: { select: { points: true } },
          round: {
            select: {
              themeName: true,
              league: { select: { name: true } },
            },
          },
        },
      });

      let maxPoints = 0;
      let best = allSubmissions[0];
      for (const sub of allSubmissions) {
        const pts = sub.votes.reduce((sum, v) => sum + v.points, 0);
        if (pts > maxPoints) {
          maxPoints = pts;
          best = sub;
        }
      }

      if (best && maxPoints > 0) {
        favoriteSubmission = {
          trackName: best.trackName,
          artistName: best.artistName,
          albumArtUrl: best.albumArtUrl,
          points: maxPoints,
          themeName: best.round.themeName,
          leagueName: best.round.league.name,
        };
      }
    }

    // Recent activity — last 5 rounds the user participated in
    const recentRounds = await ctx.db.round.findMany({
      where: {
        submissions: { some: { userId } },
        status: { in: ["RESULTS", "COMPLETED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        league: { select: { name: true } },
        submissions: {
          where: { userId },
          include: { votes: { select: { points: true } } },
        },
      },
    });

    const recentActivity = recentRounds.map((round) => {
      const userPoints = round.submissions.reduce(
        (sum, sub) => sum + sub.votes.reduce((s, v) => s + v.points, 0),
        0,
      );
      return {
        roundId: round.id,
        themeName: round.themeName,
        leagueName: round.league.name,
        points: userPoints,
        status: round.status,
      };
    });

    return {
      ...user,
      notificationPreferences:
        (user.notificationPreferences as NotificationPreferences | null) ??
        defaultNotificationPreferences,
      stats: {
        totalPoints,
        roundsWon,
        leaguesActive: leagueCount,
        submissionsMade: submissionCount,
        roundsParticipated: roundsParticipated.length,
      },
      favoriteSubmission,
      recentActivity,
    };
  }),

  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // If viewer is authenticated, only show stats from shared leagues
      const viewerId = ctx.session?.user?.id;
      let sharedLeagueFilter = {};
      if (viewerId && viewerId !== input.userId) {
        const viewerLeagues = await ctx.db.leagueMember.findMany({
          where: { userId: viewerId },
          select: { leagueId: true },
        });
        const viewerLeagueIds = viewerLeagues.map((m) => m.leagueId);

        const targetLeagues = await ctx.db.leagueMember.findMany({
          where: {
            userId: input.userId,
            leagueId: { in: viewerLeagueIds },
          },
          select: { leagueId: true },
        });
        const sharedIds = targetLeagues.map((m) => m.leagueId);
        sharedLeagueFilter = { round: { leagueId: { in: sharedIds } } };
      }

      const pointsResult = await ctx.db.vote.aggregate({
        _sum: { points: true },
        where: {
          submission: { userId: input.userId, ...sharedLeagueFilter },
        },
      });

      const submissionCount = await ctx.db.submission.count({
        where: { userId: input.userId, ...sharedLeagueFilter },
      });

      const roundsParticipated = await ctx.db.submission.groupBy({
        by: ["roundId"],
        where: { userId: input.userId, ...sharedLeagueFilter },
      });

      return {
        ...user,
        stats: {
          totalPoints: pointsResult._sum.points ?? 0,
          submissionsMade: submissionCount,
          roundsParticipated: roundsParticipated.length,
        },
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
        notificationPreferences: notificationPreferencesSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.image !== undefined) data.image = input.image;
      if (input.notificationPreferences !== undefined) {
        data.notificationPreferences = input.notificationPreferences;
      }

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data,
        select: {
          id: true,
          name: true,
          image: true,
          notificationPreferences: true,
        },
      });

      return user;
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.delete({
      where: { id: ctx.session.user.id },
    });
    return { success: true };
  }),
});
