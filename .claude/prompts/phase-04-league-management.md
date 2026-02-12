Implement the full league management system with tRPC routers and UI pages.

**Backend - `src/server/api/routers/league.ts`:**

Procedures (all protected):
- `create` - Create a league. Input: {name, description?, songsPerRound?, maxMembers?, allowDownvotes?, upvotePointsPerRound?}. Auto-generate a unique inviteCode (8-char alphanumeric). Creator becomes OWNER in LeagueMember.
- `getAll` - Get all leagues the current user is a member of, with member count and current round info
- `getById` - Get full league details by ID. Include members (with user name/image), current round, and overall standings. Verify user is a member.
- `join` - Join a league by inviteCode. Validate: not already a member, not over maxMembers.
- `updateSettings` - Update league settings. Only OWNER/ADMIN can do this. Input: partial league settings.
- `getStandings` - Get cumulative point standings for a league across all completed rounds. Return [{user, totalPoints, roundsWon}] sorted by totalPoints desc.
- `leave` - Leave a league. Owner cannot leave (must transfer ownership first or delete).
- `delete` - Delete a league. Only OWNER. Cascades to all rounds/submissions/votes.
- `regenerateInviteCode` - Generate a new invite code. OWNER/ADMIN only.

Register in root router.

**Frontend pages:**

1. `src/app/leagues/create/page.tsx` - League creation form:
   - Fields: name (required), description, songs per round (1-5, default 1), allow downvotes toggle, upvote points per round (1-20, default 10)
   - On submit, redirect to the new league's page

2. `src/app/leagues/[leagueId]/page.tsx` - League detail page:
   - League name, description, member count
   - Invite link section with copy-to-clipboard button (show full URL: /join/[inviteCode])
   - Members list with avatars and roles
   - Overall standings table (rank, name, points, rounds won)
   - "Rounds" section: list of all rounds with status badges, theme names
   - "Create Round" button (OWNER/ADMIN only)
   - League settings gear icon (OWNER/ADMIN only) that opens a settings modal

3. `src/app/join/[inviteCode]/page.tsx` - Join league page:
   - Show league name, description, member count
   - "Join League" button
   - If already a member, redirect to league page
   - After joining, redirect to league page

4. Update `src/app/dashboard/page.tsx`:
   - Show user's leagues as cards with: name, member count, current round theme, round status badge
   - "Create League" and "Join League" buttons
   - Show upcoming deadlines across all leagues

Run `pnpm check` to verify.
