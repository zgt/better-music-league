import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const PHASE_ORDER = [
  "SUBMISSION",
  "LISTENING",
  "VOTING",
  "RESULTS",
  "COMPLETED",
] as const;

export const roundRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        leagueId: z.string(),
        themeName: z.string().min(1).max(200),
        themeDescription: z.string().max(500).optional(),
        submissionDeadline: z.string().datetime(),
        votingDeadline: z.string().datetime(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify OWNER/ADMIN
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
          message: "Only owners and admins can create rounds",
        });
      }

      const submissionDeadline = new Date(input.submissionDeadline);
      const votingDeadline = new Date(input.votingDeadline);
      const now = new Date();

      if (submissionDeadline <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Submission deadline must be in the future",
        });
      }

      if (votingDeadline <= submissionDeadline) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Voting deadline must be after submission deadline",
        });
      }

      // Get next round number
      const lastRound = await ctx.db.round.findFirst({
        where: { leagueId: input.leagueId },
        orderBy: { roundNumber: "desc" },
      });

      const roundNumber = (lastRound?.roundNumber ?? 0) + 1;

      return ctx.db.round.create({
        data: {
          leagueId: input.leagueId,
          roundNumber,
          themeName: input.themeName,
          themeDescription: input.themeDescription,
          submissionDeadline,
          votingDeadline,
          status: "SUBMISSION",
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        include: {
          league: {
            include: {
              members: {
                select: { userId: true, role: true },
              },
            },
          },
          submissions: {
            include: {
              user: { select: { id: true, name: true, image: true } },
              votes: true,
            },
          },
        },
      });

      if (!round) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
      }

      // Verify membership
      const isMember = round.league.members.some(
        (m) => m.userId === ctx.session.user.id,
      );
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this league",
        });
      }

      const userRole =
        round.league.members.find((m) => m.userId === ctx.session.user.id)
          ?.role ?? "MEMBER";

      // Shape submissions based on phase
      const submissions = round.submissions.map((sub) => {
        const totalPoints = sub.votes.reduce((sum, v) => sum + v.points, 0);

        // During SUBMISSION phase, hide track info from others
        if (round.status === "SUBMISSION") {
          if (sub.userId === ctx.session.user.id) {
            return {
              id: sub.id,
              trackName: sub.trackName,
              artistName: sub.artistName,
              albumName: sub.albumName,
              albumArtUrl: sub.albumArtUrl,
              spotifyTrackId: sub.spotifyTrackId,
              previewUrl: sub.previewUrl,
              trackDurationMs: sub.trackDurationMs,
              submitter: sub.user,
              totalPoints: 0,
              isOwn: true,
            };
          }
          return null; // Hide other submissions during SUBMISSION
        }

        // During LISTENING/VOTING, show track but hide submitter
        if (
          round.status === "LISTENING" ||
          round.status === "VOTING"
        ) {
          return {
            id: sub.id,
            trackName: sub.trackName,
            artistName: sub.artistName,
            albumName: sub.albumName,
            albumArtUrl: sub.albumArtUrl,
            spotifyTrackId: sub.spotifyTrackId,
            previewUrl: sub.previewUrl,
            trackDurationMs: sub.trackDurationMs,
            submitter: null,
            totalPoints: 0,
            isOwn: sub.userId === ctx.session.user.id,
          };
        }

        // RESULTS/COMPLETED: show everything
        return {
          id: sub.id,
          trackName: sub.trackName,
          artistName: sub.artistName,
          albumName: sub.albumName,
          albumArtUrl: sub.albumArtUrl,
          spotifyTrackId: sub.spotifyTrackId,
          previewUrl: sub.previewUrl,
          trackDurationMs: sub.trackDurationMs,
          submitter: sub.user,
          totalPoints,
          isOwn: sub.userId === ctx.session.user.id,
        };
      });

      return {
        id: round.id,
        roundNumber: round.roundNumber,
        themeName: round.themeName,
        themeDescription: round.themeDescription,
        status: round.status,
        submissionDeadline: round.submissionDeadline,
        votingDeadline: round.votingDeadline,
        playlistUrl: round.playlistUrl,
        leagueId: round.leagueId,
        leagueName: round.league.name,
        songsPerRound: round.league.songsPerRound,
        upvotePointsPerRound: round.league.upvotePointsPerRound,
        allowDownvotes: round.league.allowDownvotes,
        downvotePointValue: round.league.downvotePointValue,
        submissions: submissions.filter(
          (s): s is NonNullable<typeof s> => s !== null,
        ),
        submissionCount: round.submissions.length,
        memberCount: round.league.members.length,
        userRole,
      };
    }),

  getAllForLeague: protectedProcedure
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
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this league",
        });
      }

      return ctx.db.round.findMany({
        where: { leagueId: input.leagueId },
        include: {
          _count: { select: { submissions: true } },
        },
        orderBy: { roundNumber: "desc" },
      });
    }),

  advancePhase: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        include: {
          league: {
            include: { members: { select: { userId: true, role: true } } },
          },
          submissions: {
            include: { votes: true },
          },
        },
      });

      if (!round) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
      }

      const member = round.league.members.find(
        (m) => m.userId === ctx.session.user.id,
      );
      if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can advance phases",
        });
      }

      const currentIndex = PHASE_ORDER.indexOf(round.status);
      if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Round is already completed",
        });
      }

      const nextStatus = PHASE_ORDER[currentIndex + 1]!;

      return ctx.db.round.update({
        where: { id: input.roundId },
        data: { status: nextStatus },
      });
    }),

  getCurrentRound: protectedProcedure
    .input(z.object({ leagueId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.db.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId: input.leagueId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this league",
        });
      }

      return ctx.db.round.findFirst({
        where: {
          leagueId: input.leagueId,
          status: { not: "COMPLETED" },
        },
        orderBy: { roundNumber: "desc" },
      });
    }),

  checkDeadlines: publicProcedure.mutation(async ({ ctx }) => {
    const now = new Date();

    // Advance SUBMISSION -> LISTENING when submissionDeadline passes
    const submissionRounds = await ctx.db.round.findMany({
      where: {
        status: "SUBMISSION",
        submissionDeadline: { lte: now },
      },
    });

    for (const round of submissionRounds) {
      await ctx.db.round.update({
        where: { id: round.id },
        data: { status: "LISTENING" },
      });
    }

    // Advance LISTENING -> VOTING immediately
    const listeningRounds = await ctx.db.round.findMany({
      where: { status: "LISTENING" },
    });

    for (const round of listeningRounds) {
      await ctx.db.round.update({
        where: { id: round.id },
        data: { status: "VOTING" },
      });
    }

    // Advance VOTING -> RESULTS when votingDeadline passes
    const votingRounds = await ctx.db.round.findMany({
      where: {
        status: "VOTING",
        votingDeadline: { lte: now },
      },
    });

    for (const round of votingRounds) {
      await ctx.db.round.update({
        where: { id: round.id },
        data: { status: "RESULTS" },
      });
    }

    return {
      advanced: {
        submissionToListening: submissionRounds.length,
        listeningToVoting: listeningRounds.length,
        votingToResults: votingRounds.length,
      },
    };
  }),
});
