Implement the results display and leaderboard system.

**Backend additions:**

Add to `src/server/api/routers/round.ts`:
- When `advancePhase` moves to RESULTS, calculate final standings:
  - Sum all votes per submission
  - Determine round winner(s) (handle ties)
  - Update the round status

Add to `src/server/api/routers/league.ts`:
- `getStandings` should calculate: for each member, sum all points received across all RESULTS/COMPLETED rounds. Return [{userId, userName, userImage, totalPoints, roundsWon, roundsParticipated, avgPointsPerRound}].

**Frontend - Results view `src/app/_components/results/round-results.tsx`:**

1. Round results page (shown when round is in RESULTS/COMPLETED phase):
   - Podium display for top 3:
     - 1st place: large card with gold accent, album art, track name, artist, submitter name, total points
     - 2nd/3rd: slightly smaller cards with silver/bronze accents
   - Full results list below:
     - Rank number
     - Album art thumbnail
     - Track name + artist
     - Submitted by (user name + avatar)
     - Total points (large, bold)
     - Expandable section showing: individual votes (who gave how many points) and all comments
   - Each comment shows: commenter avatar, name, comment text

2. League standings component `src/app/_components/results/league-standings.tsx`:
   - Table with columns: Rank, Player (avatar + name), Total Points, Rounds Won, Rounds Played
   - Highlight current user's row
   - Sort by total points descending
   - Show on the league detail page

3. Round history on league page:
   - List of completed rounds showing: round number, theme, winner name + winning song, date completed
   - Click to view full results

**Frontend - Update round page to show results:**
- During RESULTS phase, replace the content area with the results view
- Show "View Full Results" button that scrolls to detailed breakdown
- Celebrate the winner with some visual flair (subtle animation, gold highlights)

Run `pnpm check` to verify.
