Implement the voting and commenting system.

**Backend - `src/server/api/routers/vote.ts`:**

Procedures (all protected):
- `submit` - Submit votes for a round. Input: {roundId, votes: [{submissionId, points}], comments: [{submissionId, text}]}. Validate:
  - Round is in VOTING phase
  - User is a league member
  - User hasn't already voted (or update existing votes)
  - Cannot vote on own submissions
  - Total positive points must equal the league's upvotePointsPerRound
  - If downvotes allowed, negative points use the league's downvotePointValue
  - Points per submission must be integers >= 0 (or >= downvotePointValue if downvotes allowed)
  - Each submissionId must belong to this round
  - Use a transaction: delete existing votes/comments for this user+round, then insert new ones
- `getMyVotes` - Get current user's votes and comments for a round (to pre-populate the form if editing)
- `getResults` - Get full results for a round. Only available when round is in RESULTS or COMPLETED phase. Return: [{submission (with submitter info), totalPoints, votes: [{voter, points}], comments: [{commenter, text}]}] sorted by totalPoints desc.
- `hasVoted` - Check if current user has voted in a round.

Register in root router.

**Frontend - Voting interface `src/app/_components/voting/vote-interface.tsx`:**

1. Display all submissions for the round (excluding user's own):
   - Album art, track name, artist
   - Audio preview/Spotify link
   - Point allocation: numeric input or +/- stepper buttons (0 to upvotePointsPerRound)
   - If downvotes enabled: allow negative value (show as separate downvote button)
   - Comment textarea below each song (optional, max 280 chars)

2. Points budget display:
   - "Points remaining: X / Y" shown prominently at top
   - Update in real-time as user allocates points
   - Color changes: green (points remaining), amber (few left), red (over budget)
   - Cannot submit until all points are allocated (total must equal upvotePointsPerRound)

3. Vote summary before submission:
   - Show point allocation summary
   - Confirm button
   - "You cannot change votes after the voting phase ends"

4. Post-vote state:
   - Show "You've voted!" confirmation
   - Allow editing votes (re-opens the form with current allocations pre-filled)
   - Show "X of Y members have voted" progress

**Integrate into round page:**
- During VOTING phase, show the voting interface
- If user has already voted, show their allocations with edit option
- Show submission count and vote progress

Run `pnpm check` to verify.
