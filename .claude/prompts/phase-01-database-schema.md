Design and implement the Prisma schema for a music league app in `prisma/schema.prisma`. Keep the existing Better Auth models (User, Session, Account, Verification) untouched.

Add these models:

**League**
- id (cuid), name, description (optional), createdAt, updatedAt
- creatorId (relation to User)
- settings as individual fields: songsPerRound (Int, default 1), maxMembers (Int, default 20), allowDownvotes (Boolean, default false), downvotePointValue (Int, default -1), upvotePointsPerRound (Int, default 10), isPublic (Boolean, default false)
- status enum: ACTIVE, COMPLETED, ARCHIVED
- inviteCode (unique string for join links)

**LeagueMember**
- id, leagueId, userId, joinedAt
- role enum: OWNER, ADMIN, MEMBER
- unique constraint on [leagueId, userId]

**Round**
- id, leagueId, roundNumber (Int)
- themeName, themeDescription (optional)
- status enum: SUBMISSION, LISTENING, VOTING, RESULTS, COMPLETED
- submissionDeadline, votingDeadline (DateTime)
- playlistUrl (optional, Spotify playlist link)
- createdAt, updatedAt

**Submission**
- id, roundId, userId
- spotifyTrackId, trackName, artistName, albumName, albumArtUrl, previewUrl (optional), trackDurationMs (Int)
- createdAt
- unique constraint on [roundId, userId, spotifyTrackId]

**Vote**
- id, roundId, voterId, submissionId
- points (Int)
- unique constraint on [roundId, voterId, submissionId]

**Comment**
- id, submissionId, userId
- text (String), createdAt
- unique constraint on [submissionId, userId] (one comment per submission per user)

**ThemeTemplate**
- id, name, description, category (String)
- Seed with ~30 music league themes like: "Guilty Pleasures", "One-Hit Wonders", "Covers", "Songs from the Year You Were Born", "Instrumentals", "Songs Under 3 Minutes", "Live Performances", "B-Sides & Deep Cuts", "Songs in a Foreign Language", "Movie Soundtracks", etc.

Add proper indexes on foreign keys and commonly queried fields. Set up cascade deletes where appropriate (deleting a league deletes its rounds, submissions, votes, etc.).

After defining the schema, run `pnpm db:push` to sync it to the database.
