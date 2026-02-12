import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const voteRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        roundId: z.string(),
        votes: z.array(
          z.object({
            submissionId: z.string(),
            points: z.number().int(),
          }),
        ),
        comments: z.array(
          z.object({
            submissionId: z.string(),
            text: z.string().max(280),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        include: {
          league: {
            include: { members: { select: { userId: true } } },
          },
          submissions: { select: { id: true, userId: true } },
        },
      });

      if (!round) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
      }

      if (round.status !== "VOTING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Round is not in voting phase",
        });
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

      // Build lookup for submissions in this round
      const submissionMap = new Map(
        round.submissions.map((s) => [s.id, s]),
      );

      // Validate each vote
      for (const vote of input.votes) {
        const submission = submissionMap.get(vote.submissionId);
        if (!submission) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Submission ${vote.submissionId} does not belong to this round`,
          });
        }

        if (submission.userId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot vote on your own submission",
          });
        }

        // Validate point ranges
        const minPoints = round.league.allowDownvotes
          ? round.league.downvotePointValue
          : 0;
        if (vote.points < minPoints) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Points per submission must be >= ${minPoints}`,
          });
        }

        if (vote.points > round.league.upvotePointsPerRound) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Points per submission cannot exceed ${round.league.upvotePointsPerRound}`,
          });
        }
      }

      // Validate total positive points
      const totalPositive = input.votes.reduce(
        (sum, v) => sum + Math.max(0, v.points),
        0,
      );
      if (totalPositive !== round.league.upvotePointsPerRound) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Total positive points must equal ${round.league.upvotePointsPerRound} (got ${totalPositive})`,
        });
      }

      // Validate comments reference valid submissions
      for (const comment of input.comments) {
        if (!submissionMap.has(comment.submissionId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Comment references invalid submission ${comment.submissionId}`,
          });
        }
      }

      // Transaction: delete existing votes/comments, insert new ones
      await ctx.db.$transaction(async (tx) => {
        // Delete existing votes for this user in this round
        await tx.vote.deleteMany({
          where: {
            roundId: input.roundId,
            voterId: ctx.session.user.id,
          },
        });

        // Delete existing comments for this user on submissions in this round
        const roundSubmissionIds = round.submissions.map((s) => s.id);
        await tx.comment.deleteMany({
          where: {
            submissionId: { in: roundSubmissionIds },
            userId: ctx.session.user.id,
          },
        });

        // Insert new votes (only non-zero)
        const votesToCreate = input.votes.filter((v) => v.points !== 0);
        if (votesToCreate.length > 0) {
          await tx.vote.createMany({
            data: votesToCreate.map((v) => ({
              roundId: input.roundId,
              voterId: ctx.session.user.id,
              submissionId: v.submissionId,
              points: v.points,
            })),
          });
        }

        // Insert new comments (only non-empty)
        const commentsToCreate = input.comments.filter(
          (c) => c.text.trim().length > 0,
        );
        if (commentsToCreate.length > 0) {
          await tx.comment.createMany({
            data: commentsToCreate.map((c) => ({
              submissionId: c.submissionId,
              userId: ctx.session.user.id,
              text: c.text.trim(),
            })),
          });
        }
      });

      return { success: true };
    }),

  getMyVotes: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db.vote.findMany({
        where: {
          roundId: input.roundId,
          voterId: ctx.session.user.id,
        },
      });

      // Also get comments on submissions in this round
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        select: { submissions: { select: { id: true } } },
      });

      const submissionIds = round?.submissions.map((s) => s.id) ?? [];
      const comments = await ctx.db.comment.findMany({
        where: {
          submissionId: { in: submissionIds },
          userId: ctx.session.user.id,
        },
      });

      return {
        votes: votes.map((v) => ({
          submissionId: v.submissionId,
          points: v.points,
        })),
        comments: comments.map((c) => ({
          submissionId: c.submissionId,
          text: c.text,
        })),
      };
    }),

  getResults: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const round = await ctx.db.round.findUnique({
        where: { id: input.roundId },
        include: {
          league: {
            include: { members: { select: { userId: true } } },
          },
          submissions: {
            include: {
              user: { select: { id: true, name: true, image: true } },
              votes: {
                include: {
                  voter: { select: { id: true, name: true, image: true } },
                },
              },
              comments: {
                include: {
                  user: { select: { id: true, name: true, image: true } },
                },
              },
            },
          },
        },
      });

      if (!round) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Round not found" });
      }

      if (round.status !== "RESULTS" && round.status !== "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Results are only available after voting ends",
        });
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

      return round.submissions
        .map((sub) => ({
          submission: {
            id: sub.id,
            trackName: sub.trackName,
            artistName: sub.artistName,
            albumName: sub.albumName,
            albumArtUrl: sub.albumArtUrl,
            spotifyTrackId: sub.spotifyTrackId,
            previewUrl: sub.previewUrl,
            trackDurationMs: sub.trackDurationMs,
          },
          submitter: sub.user,
          totalPoints: sub.votes.reduce((sum, v) => sum + v.points, 0),
          votes: sub.votes.map((v) => ({
            voter: v.voter,
            points: v.points,
          })),
          comments: sub.comments.map((c) => ({
            commenter: c.user,
            text: c.text,
          })),
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
    }),

  hasVoted: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const voteCount = await ctx.db.vote.count({
        where: {
          roundId: input.roundId,
          voterId: ctx.session.user.id,
        },
      });

      return { hasVoted: voteCount > 0 };
    }),
});
