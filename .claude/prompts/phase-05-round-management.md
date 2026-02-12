Implement round management - creating rounds, managing round phases, and the theme library.

**Backend - `src/server/api/routers/round.ts`:**

Procedures (all protected):
- `create` - Create a new round. Input: {leagueId, themeName, themeDescription?, submissionDeadline, votingDeadline}. Only OWNER/ADMIN. Validate: votingDeadline > submissionDeadline, both in the future. Auto-assign roundNumber (increment from last round). Set initial status to SUBMISSION.
- `getById` - Get round details with submissions (only show track info during VOTING phase, reveal submitter after RESULTS). Include vote counts if in RESULTS phase.
- `getAllForLeague` - Get all rounds for a league with status and basic info.
- `advancePhase` - Manually advance a round's phase. OWNER/ADMIN only. Valid transitions: SUBMISSION->LISTENING->VOTING->RESULTS->COMPLETED. When advancing to RESULTS, calculate and store all point totals.
- `getCurrentRound` - Get the current active round (not COMPLETED) for a league.

**Theme templates - `src/server/api/routers/theme.ts`:**
- `getAll` - Public procedure. Returns all theme templates grouped by category.
- Categories: "Classic", "Genre", "Era", "Mood", "Challenge", "Personal"

**Seed themes** - Create a seed script or include in the schema seed. Themes like:
- Classic: "Guilty Pleasures", "One-Hit Wonders", "Covers", "Duets"
- Genre: "Jazz", "Hip-Hop", "Country", "Electronic", "Punk"
- Era: "Songs from the 80s", "Songs from the 2000s", "Songs from the Year You Were Born"
- Mood: "Songs That Make You Cry", "Road Trip Anthems", "Late Night Vibes", "Workout Bangers"
- Challenge: "Songs Under 3 Minutes", "Songs with a Color in the Title", "One-Word Song Titles", "Instrumentals Only", "Foreign Language Songs"
- Personal: "Your Most Played Song", "A Song That Changed Your Life", "Your Guilty Pleasure", "A Song That Reminds You of Someone"

Register routers in root.

**Frontend:**

1. `src/app/leagues/[leagueId]/rounds/create/page.tsx` - Create round form:
   - Theme name input (free text)
   - Theme description textarea
   - "Browse Themes" button that opens a modal with theme templates organized by category - clicking one fills in the theme name
   - Submission deadline datetime picker
   - Voting deadline datetime picker (must be after submission deadline)
   - Create button

2. `src/app/leagues/[leagueId]/rounds/[roundId]/page.tsx` - Round detail page:
   - Theme name and description prominently displayed
   - Current phase badge and progress indicator (4 steps: Submit -> Listen -> Vote -> Results)
   - Deadline countdown timers
   - Content changes based on phase:
     - SUBMISSION: Show submission form (Phase 6) or "Waiting for submissions" with count
     - LISTENING: Show playlist/track list with Spotify embeds
     - VOTING: Show voting interface (Phase 7)
     - RESULTS: Show results (Phase 8)
   - Admin controls: "Advance Phase" button with confirmation

3. Update the league detail page to show rounds list with clickable cards.

**Cron/scheduled phase advancement:**
- Create a tRPC procedure `checkDeadlines` that can be called by a Vercel cron job
- Create `src/app/api/cron/advance-rounds/route.ts` - API route that checks all rounds and advances phases when deadlines pass
- SUBMISSION phase auto-advances to LISTENING when submissionDeadline passes
- LISTENING auto-advances to VOTING immediately (or after a configurable delay)
- VOTING auto-advances to RESULTS when votingDeadline passes

Run `pnpm check` to verify.
