Set up Spotify API integration for the music league app. We need server-side Spotify Web API access using the Client Credentials flow (no user OAuth needed - we just need search and track metadata).

1. Add environment variables to `src/env.js`:
   - SPOTIFY_CLIENT_ID (server)
   - SPOTIFY_CLIENT_SECRET (server)

2. Create `src/server/spotify/client.ts`:
   - Implement a Spotify client that uses Client Credentials flow (POST to https://accounts.spotify.com/api/token with grant_type=client_credentials)
   - Cache the access token and auto-refresh when expired (tokens last 3600s)
   - Export functions:
     - `searchTracks(query: string, limit?: number)` - search Spotify catalog, return simplified track objects {spotifyTrackId, trackName, artistName, albumName, albumArtUrl, previewUrl, trackDurationMs}
     - `getTrack(trackId: string)` - get single track metadata
     - `createPlaylist(name: string, description: string, trackUris: string[])` - NOTE: this requires a user token, so for now just return a list of spotify URIs. We'll generate a shareable link later.
   - Use native fetch, no external Spotify SDK needed

3. Create a tRPC router `src/server/api/routers/spotify.ts`:
   - `search` - protected procedure, takes {query: string, limit?: number}, returns track results
   - Register it in the root router

4. Update `.env.example` with the new Spotify variables

5. Run `pnpm check` to verify everything compiles.
