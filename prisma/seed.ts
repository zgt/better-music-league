import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

const themes = [
  { name: "Guilty Pleasures", description: "Songs you secretly love but would never admit to", category: "Personal" },
  { name: "One-Hit Wonders", description: "Artists known for just one big song", category: "Artists" },
  { name: "Covers", description: "Cover versions that rival or surpass the original", category: "Versions" },
  { name: "Songs from the Year You Were Born", description: "A track released in your birth year", category: "Personal" },
  { name: "Instrumentals", description: "No vocals allowed — let the instruments speak", category: "Genre" },
  { name: "Songs Under 3 Minutes", description: "Short and sweet — get in, get out", category: "Format" },
  { name: "Live Performances", description: "Live recordings only", category: "Format" },
  { name: "B-Sides & Deep Cuts", description: "No singles — album tracks and hidden gems only", category: "Discovery" },
  { name: "Songs in a Foreign Language", description: "Music not in your native language", category: "World" },
  { name: "Movie Soundtracks", description: "Songs featured in film soundtracks", category: "Media" },
  { name: "Breakup Songs", description: "Songs about heartbreak and moving on", category: "Mood" },
  { name: "Road Trip Anthems", description: "Songs perfect for driving with the windows down", category: "Mood" },
  { name: "One Word Titles", description: "Song title must be a single word", category: "Format" },
  { name: "Debut Singles", description: "The first single released by an artist", category: "Artists" },
  { name: "Songs That Sample Other Songs", description: "Tracks built on samples from other music", category: "Production" },
  { name: "Duets & Collaborations", description: "Two or more artists sharing the spotlight", category: "Artists" },
  { name: "Songs Over 7 Minutes", description: "Epic length tracks only", category: "Format" },
  { name: "Songs with a Color in the Title", description: "The title must contain a color", category: "Format" },
  { name: "90s Nostalgia", description: "Tracks that defined the 1990s", category: "Era" },
  { name: "Songs That Make You Cry", description: "Emotionally devastating tracks", category: "Mood" },
  { name: "Dance Floor Bangers", description: "Songs that get everyone moving", category: "Mood" },
  { name: "Acoustic Versions", description: "Stripped-down acoustic performances", category: "Versions" },
  { name: "Songs with a Name in the Title", description: "The title must include a person's name", category: "Format" },
  { name: "Protest Songs", description: "Music with a political or social message", category: "Theme" },
  { name: "TV Show Theme Songs", description: "Iconic themes from television", category: "Media" },
  { name: "Songs You Discovered This Year", description: "Tracks new to you, regardless of release date", category: "Discovery" },
  { name: "Rainy Day Vibes", description: "Music for a gray, cozy day indoors", category: "Mood" },
  { name: "Songs by Local Artists", description: "Music from artists in your area", category: "Discovery" },
  { name: "Remixes", description: "Remixed versions of existing tracks", category: "Versions" },
  { name: "Songs with Animals in the Title", description: "The title must reference an animal", category: "Format" },
];

async function main() {
  console.log("Seeding theme templates...");

  const result = await db.themeTemplate.createMany({
    data: themes,
    skipDuplicates: true,
  });

  console.log(`Seeded ${result.count} theme templates.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
