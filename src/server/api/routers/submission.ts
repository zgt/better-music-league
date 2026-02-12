import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const submissionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        roundId: z.string(),
        spotifyTrackId: z.string(),
        trackName: z.string(),
        artistName: z.string(),
        albumName: z.string(),
        albumArtUrl: z.string(),
        previewUrl: z.string().nullish(),
        trackDurationMs: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get round with league info
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        include: {
          league: {
            include: { members: { select: { userId: true } } },
          },
        },
      });

      if (!round) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
      }

      if (round.status !== "SUBMISSION") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Round is not in submission phase",
        });
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

      // Check songs per round limit
      const userSubmissionCount = await ctx.db.submission.count({
        where: {
          roundId: input.roundId,
          userId: ctx.session.user.id,
        },
      });

      if (userSubmissionCount >= round.league.songsPerRound) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can only submit ${round.league.songsPerRound} song(s) per round`,
        });
      }

      // Check if same track already submitted by another user
      const existingTrack = await ctx.db.submission.findFirst({
        where: {
          roundId: input.roundId,
          spotifyTrackId: input.spotifyTrackId,
          userId: { not: ctx.session.user.id },
        },
      });

      if (existingTrack) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This track has already been submitted by another user",
        });
      }

      return ctx.db.submission.create({
        data: {
          roundId: input.roundId,
          userId: ctx.session.user.id,
          spotifyTrackId: input.spotifyTrackId,
          trackName: input.trackName,
          artistName: input.artistName,
          albumName: input.albumName,
          albumArtUrl: input.albumArtUrl,
          previewUrl: input.previewUrl,
          trackDurationMs: input.trackDurationMs,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.submission.findUnique({
        where: { id: input.submissionId },
        include: { round: true },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      if (submission.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own submissions",
        });
      }

      if (submission.round.status !== "SUBMISSION") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only remove submissions during submission phase",
        });
      }

      await ctx.db.submission.delete({
        where: { id: input.submissionId },
      });

      return { success: true };
    }),

  getMySubmissions: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.submission.findMany({
        where: {
          roundId: input.roundId,
          userId: ctx.session.user.id,
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  getAllForRound: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        include: {
          league: {
            include: { members: { select: { userId: true } } },
          },
        },
      });

      if (!round) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
      }

      const isMember = round.league.members.some(
        (m) => m.userId === ctx.session.user.id,
      );
      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this league",
        });
      }

      const submissions = await ctx.db.submission.findMany({
        where: { roundId: input.roundId },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return submissions.map((sub) => {
        // During SUBMISSION or LISTENING, hide submitter identity
        if (
          round.status === "SUBMISSION" ||
          round.status === "LISTENING"
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
            isOwn: sub.userId === ctx.session.user.id,
          };
        }

        // During VOTING, include track info but not submitter
        if (round.status === "VOTING") {
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
            isOwn: sub.userId === ctx.session.user.id,
          };
        }

        // RESULTS/COMPLETED: include everything
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
          isOwn: sub.userId === ctx.session.user.id,
        };
      });
    }),

  getCount: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Count distinct users who have submitted
      const submissions = await ctx.db.submission.findMany({
        where: { roundId: input.roundId },
        select: { userId: true },
        distinct: ["userId"],
      });

      return { count: submissions.length };
    }),
});
