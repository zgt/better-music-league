import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { searchTracks } from "~/server/spotify/client";

export const spotifyRouter = createTRPCRouter({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1), limit: z.number().min(1).max(50).optional() }))
    .query(async ({ input }) => {
      return searchTracks(input.query, input.limit);
    }),
});
