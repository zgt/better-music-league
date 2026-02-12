Implement the song submission system with Spotify search integration.

**Backend - `src/server/api/routers/submission.ts`:**

Procedures (all protected):
- `create` - Submit a song. Input: {roundId, spotifyTrackId, trackName, artistName, albumName, albumArtUrl, previewUrl?, trackDurationMs}. Validate: round is in SUBMISSION phase, user is a league member, user hasn't exceeded songsPerRound limit for this round, same track not already submitted by another user in this round.
- `delete` - Remove own submission. Only during SUBMISSION phase.
- `getMySubmissions` - Get current user's submissions for a round.
- `getAllForRound` - Get all submissions for a round. During SUBMISSION/LISTENING phase, don't include userId (anonymous). During VOTING, include track info but not submitter. During RESULTS/COMPLETED, include everything.
- `getCount` - Get submission count for a round (how many users have submitted).

Register in root router.

**Frontend - Song submission component `src/app/_components/submission/submit-song.tsx`:**

1. Spotify search input:
   - Text input with debounced search (300ms delay)
   - Dropdown results showing: album art thumbnail (40x40), track name, artist name, album name, duration
   - Click to select a track
   - Show selected track as a card with full metadata

2. Selected track card:
   - Album art (larger, ~120x120)
   - Track name, artist, album
   - Duration formatted as m:ss
   - Spotify preview player (if previewUrl available) - simple HTML5 audio element with play/pause
   - "Submit" button and "Cancel" button

3. My submissions list:
   - Show already-submitted songs as cards
   - "Remove" button on each (only during SUBMISSION phase)
   - Show count: "1/2 songs submitted" based on songsPerRound setting

**Integrate into the round page:**
- During SUBMISSION phase, show the submission interface
- Show "X of Y members have submitted" progress
- If user has submitted max songs, show their submissions with edit capability

**Track list display component `src/app/_components/submission/track-list.tsx`:**
- Used during LISTENING phase
- List of all submitted tracks (anonymous)
- Album art, track name, artist, duration
- Spotify embed or preview audio for each track
- Generate a "Open in Spotify" link using track IDs: https://open.spotify.com/track/{id}

Run `pnpm check` to verify.
