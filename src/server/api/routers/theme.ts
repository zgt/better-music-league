import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const THEME_TEMPLATES = [
  // Classic
  { name: "Guilty Pleasures", description: "Songs you love but are embarrassed to admit", category: "Classic" },
  { name: "One-Hit Wonders", description: "Artists known for just one big hit", category: "Classic" },
  { name: "Covers", description: "Cover versions of songs", category: "Classic" },
  { name: "Duets", description: "Songs featuring two or more artists", category: "Classic" },

  // Genre
  { name: "Jazz", description: "Jazz tracks of any era", category: "Genre" },
  { name: "Hip-Hop", description: "Hip-hop and rap tracks", category: "Genre" },
  { name: "Country", description: "Country music", category: "Genre" },
  { name: "Electronic", description: "Electronic, EDM, or synth-based music", category: "Genre" },
  { name: "Punk", description: "Punk rock and its subgenres", category: "Genre" },

  // Era
  { name: "Songs from the 80s", description: "Released between 1980-1989", category: "Era" },
  { name: "Songs from the 2000s", description: "Released between 2000-2009", category: "Era" },
  { name: "Songs from the Year You Were Born", description: "Released the year you were born", category: "Era" },

  // Mood
  { name: "Songs That Make You Cry", description: "Emotionally devastating tracks", category: "Mood" },
  { name: "Road Trip Anthems", description: "Perfect for driving with the windows down", category: "Mood" },
  { name: "Late Night Vibes", description: "Music for the late hours", category: "Mood" },
  { name: "Workout Bangers", description: "High energy tracks to get you moving", category: "Mood" },

  // Challenge
  { name: "Songs Under 3 Minutes", description: "Short and sweet - under 3 minutes", category: "Challenge" },
  { name: "Songs with a Color in the Title", description: "The title must contain a color", category: "Challenge" },
  { name: "One-Word Song Titles", description: "The title is a single word", category: "Challenge" },
  { name: "Instrumentals Only", description: "No vocals allowed", category: "Challenge" },
  { name: "Foreign Language Songs", description: "Sung in a language other than English", category: "Challenge" },

  // Personal
  { name: "Your Most Played Song", description: "Your current most-listened track", category: "Personal" },
  { name: "A Song That Changed Your Life", description: "A track that had a profound impact on you", category: "Personal" },
  { name: "Your Guilty Pleasure", description: "The song you secretly love", category: "Personal" },
  { name: "A Song That Reminds You of Someone", description: "A track tied to a specific person", category: "Personal" },
] as const;

export const themeRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    const grouped = new Map<string, { name: string; description: string }[]>();

    for (const theme of THEME_TEMPLATES) {
      const existing = grouped.get(theme.category) ?? [];
      existing.push({ name: theme.name, description: theme.description });
      grouped.set(theme.category, existing);
    }

    return Array.from(grouped.entries()).map(([category, themes]) => ({
      category,
      themes,
    }));
  }),
});
