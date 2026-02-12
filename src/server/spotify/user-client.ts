import { db } from "~/server/db";
import { env } from "~/env";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

/**
 * Retrieves a valid Spotify access token for the user.
 * Refreshes the token if it's expired or about to expire.
 */
export async function getValidUserToken(userId: string): Promise<string> {
  const account = await db.account.findFirst({
    where: {
      userId,
      providerId: "spotify",
    },
  });

  if (!account?.accessToken || !account?.refreshToken) {
    throw new Error("User does not have a connected Spotify account");
  }

  // Check if token is expired or expires in less than 5 minutes
  const now = new Date();
  const expiresAt = account.accessTokenExpiresAt ?? new Date(0);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt > fiveMinutesFromNow) {
    return account.accessToken;
  }

  // Token is expired or expiring soon, refresh it
  console.log(`Refreshing Spotify token for user ${userId}`);

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
  });

  const authHeader = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
    body: params,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to refresh Spotify token:", errorText);
    throw new Error(`Failed to refresh Spotify token: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string; // Sometimes returned
    scope: string;
  };

  const newExpiresAt = new Date(now.getTime() + data.expires_in * 1000);

  await db.account.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      accessTokenExpiresAt: newExpiresAt,
      refreshToken: data.refresh_token ?? account.refreshToken, // Update refresh token if provided
      updatedAt: new Date(),
    },
  });

  return data.access_token;
}

/**
 * Creates a playlist in the user's Spotify account and adds tracks to it.
 * Returns the public URL of the created playlist.
 */
export async function createPlaylistForUser(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
): Promise<string> {
  const accessToken = await getValidUserToken(userId);

  // 1. Get User's Spotify ID
  const meRes = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!meRes.ok) {
    throw new Error(`Failed to fetch Spotify user profile: ${meRes.status}`);
  }

  const meData = (await meRes.json()) as { id: string };
  const spotifyUserId = meData.id;

  // 2. Create Playlist
  const createRes = await fetch(
    `${API_BASE}/users/${spotifyUserId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        public: true, // Default to public
      }),
    },
  );

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("Failed to create Spotify playlist:", errorText);
    throw new Error(`Failed to create Spotify playlist: ${createRes.status}`);
  }

  const playlistData = (await createRes.json()) as {
    id: string;
    external_urls: { spotify: string };
  };
  const playlistId = playlistData.id;
  const playlistUrl = playlistData.external_urls.spotify;

  // 3. Add Tracks (in batches of 100 if necessary, but we'll assume <100 for now or implement simple batching)
  if (trackUris.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      const addRes = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });

      if (!addRes.ok) {
        console.error("Failed to add tracks to playlist:", await addRes.text());
        // Continue adding other batches even if one fails? Or throw?
        // For now, throw to alert failure.
         throw new Error(`Failed to add tracks to playlist: ${addRes.status}`);
      }
    }
  }

  return playlistUrl;
}
