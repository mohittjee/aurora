import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log("Spotify Auth - Code:", code);
  console.log("Spotify Auth - Redirect URI:", redirectUri);
  console.log("Spotify Auth - Client ID:", clientId);
  console.log("Spotify Auth - Client Secret:", clientSecret ? "[REDACTED]" : "MISSING");

  if (!code) {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=user-read-private%20streaming`;
    console.log("Redirecting to Spotify Auth URL:", authUrl);
    return NextResponse.redirect(authUrl);
  }

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Spotify Auth Error: Missing environment variables");
    return NextResponse.json({ error: "Server configuration error: Missing Spotify credentials" }, { status: 500 });
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    console.log("Spotify Auth Success - Access Token:", access_token);
    console.log("Spotify Auth Success - Refresh Token:", refresh_token);
    return NextResponse.json({ accessToken: access_token, refreshToken: refresh_token });
  } catch (error) {
    console.error("Spotify Auth Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to authenticate with Spotify", details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}