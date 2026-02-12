import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex"); // 8-char hex string
}

export const leagueRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        songsPerRound: z.number().int().min(1).max(5).default(1),
        maxMembers: z.number().int().min(2).max(50).default(20),
        allowDownvotes: z.boolean().default(false),
        upvotePointsPerRound: z.number().int().min(1).max(20).default(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const league = await ctx.db.league.create({
        data: {
          name: input.name,
          description: input.description,
          songsPerRound: input.songsPerRound,
          maxMembers: input.maxMembers,
          allowDownvotes: input.allowDownvotes,
          upvotePointsPerRound: input.upvotePointsPerRound,
          inviteCode: generateInviteCode(),
          creatorId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "OWNER",
            },
          },
        },
      });

      return league;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const leagues = await ctx.db.league.findMany({
      where: {
        members: { some: { userId: ctx.session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
        rounds: {
          where: { status: { not: "COMPLETED" } },
          orderBy: { roundNumber: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return leagues;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const league = await ctx.db.league.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { joinedAt: "asc" },
          },
          rounds: {
            orderBy: { roundNumber: "desc" },
            include: {
              submissions: {
                include: {
                  user: { select: { id: true, name: true, image: true } },
                  votes: { select: { points: true } },
                },
              },
            },
          },
          _count: { select: { members: true } },
        },
      });

      if (!league) {
        throw new TRPCError({ code: "NOT_FOUND", message: "League not found" });
      }

      const isMember = league.members.some(
        (m) => m.userId === ctx.session.user.id,
      );
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this league",
        });
      }

      return league;
    }),

  join: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const league = await ctx.db.league.findUnique({
        where: { inviteCode: input.inviteCode },
        include: { _count: { select: { members: true } } },
      });

      if (!league) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invite code",
        });
      }

      const existingMember = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: league.id,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this league",
        });
      }

      if (league._count.members >= league.maxMembers) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This league is full",
        });
      }

      await ctx.db.leagueMember.create({
        data: {
          leagueId: league.id,
          userId: ctx.session.user.id,
        },
      });

      return league;
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        leagueId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        songsPerRound: z.number().int().min(1).max(5).optional(),
        maxMembers: z.number().int().min(2).max(50).optional(),
        allowDownvotes: z.boolean().optional(),
        upvotePointsPerRound: z.number().int().min(1).max(20).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update settings",
        });
      }

      const { leagueId, ...data } = input;
      return ctx.db.league.update({
        where: { id: leagueId },
        data,
      });
    }),

  getStandings: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify membership
      const member = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a member" });
      }

      // Get all scored rounds (RESULTS or COMPLETED) for this league
      const scoredRounds = await ctx.db.round.findMany({
        where: {
          leagueId: input.leagueId,
          status: { in: ["RESULTS", "COMPLETED"] },
        },
        include: {
          submissions: {
            include: {
              votes: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });

      // Aggregate points per user
      const userPoints = new Map<
        string,
        {
          user: { id: string; name: string; image: string | null };
          totalPoints: number;
          roundsWon: number;
          roundsParticipated: number;
        }
      >();

      for (const round of scoredRounds) {
        const roundScores = new Map<string, number>();
        const participants = new Set<string>();

        for (const submission of round.submissions) {
          const points = submission.votes.reduce((sum, v) => sum + v.points, 0);
          const current = roundScores.get(submission.userId) ?? 0;
          roundScores.set(submission.userId, current + points);
          participants.add(submission.userId);

          if (!userPoints.has(submission.userId)) {
            userPoints.set(submission.userId, {
              user: submission.user,
              totalPoints: 0,
              roundsWon: 0,
              roundsParticipated: 0,
            });
          }
          const entry = userPoints.get(submission.userId)!;
          entry.totalPoints += points;
        }

        // Track participation
        for (const userId of participants) {
          const entry = userPoints.get(userId);
          if (entry) entry.roundsParticipated += 1;
        }

        // Determine round winner(s) (handle ties)
        let maxPoints = 0;
        for (const [, points] of roundScores) {
          if (points > maxPoints) maxPoints = points;
        }
        if (maxPoints > 0) {
          for (const [userId, points] of roundScores) {
            if (points === maxPoints && userPoints.has(userId)) {
              userPoints.get(userId)!.roundsWon += 1;
            }
          }
        }
      }

      // Include members with 0 points
      const members = await ctx.db.leagueMember.findMany({
        where: { leagueId: input.leagueId },
        include: { user: { select: { id: true, name: true, image: true } } },
      });

      for (const m of members) {
        if (!userPoints.has(m.userId)) {
          userPoints.set(m.userId, {
            user: m.user,
            totalPoints: 0,
            roundsWon: 0,
            roundsParticipated: 0,
          });
        }
      }

      return Array.from(userPoints.values())
        .map((entry) => ({
          ...entry,
          avgPointsPerRound:
            entry.roundsParticipated > 0
              ? Math.round((entry.totalPoints / entry.roundsParticipated) * 10) / 10
              : 0,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
    }),

  leave: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not a member" });
      }

      if (member.role === "OWNER") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Owner cannot leave. Transfer ownership or delete the league.",
        });
      }

      await ctx.db.leagueMember.delete({
        where: { id: member.id },
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (member?.role !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can delete a league",
        });
      }

      await ctx.db.league.delete({
        where: { id: input.leagueId },
      });

      return { success: true };
    }),

  regenerateInviteCode: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can regenerate the invite code",
        });
      }

      const league = await ctx.db.league.update({
        where: { id: input.leagueId },
        data: { inviteCode: generateInviteCode() },
      });

      return { inviteCode: league.inviteCode };
    }),
});
