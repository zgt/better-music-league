import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { leagueRouter } from "~/server/api/routers/league";
import { roundRouter } from "~/server/api/routers/round";
import { spotifyRouter } from "~/server/api/routers/spotify";
import { submissionRouter } from "~/server/api/routers/submission";
import { themeRouter } from "~/server/api/routers/theme";
import { userRouter } from "~/server/api/routers/user";
import { voteRouter } from "~/server/api/routers/vote";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  league: leagueRouter,
  round: roundRouter,
  spotify: spotifyRouter,
  submission: submissionRouter,
  theme: themeRouter,
  user: userRouter,
  vote: voteRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
