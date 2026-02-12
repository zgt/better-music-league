Implement automatic Spotify playlist generation for each round.

Since we're using Client Credentials flow (no user OAuth), we can't create playlists in a user's account directly. Instead, implement two approaches:

1. **"Open in Spotify" batch link**: Generate a Spotify URI that opens the Spotify app with all tracks queued. Create a utility function that builds a URI like `https://open.spotify.com/track/{id}` for individual tracks.

2. **Playlist page** `src/app/leagues/[leagueId]/rounds/[roundId]/playlist/page.tsx`:
   - Display all submitted tracks in a clean list format
   - Each track has an "Open in Spotify" link
   - "Copy all track links" button
   - Spotify embed iframes for each track (https://open.spotify.com/embed/track/{id}) for in-browser playback of 30-second previews
   - Instructions for manually creating a playlist: "Search for these tracks on Spotify and add them to a new playlist"

3. **Optional: Spotify user OAuth** (for later enhancement):
   - Add a note in the round admin panel: "Connect your Spotify account to auto-generate playlists"
   - This would require adding Spotify as another OAuth provider in Better Auth
   - For now, store a `playlistUrl` field on the Round model that admins can manually fill in after creating the playlist

4. Update the round page's LISTENING phase to prominently feature the playlist with Spotify embeds.

Run `pnpm check` to verify.
