import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh Google access token");
  }

  return res.json();
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  // 1) Identify user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) Fetch tokens
  const { data: tokenRow } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!tokenRow) {
    return NextResponse.json([]); // user hasn't connected Google
  }

  let accessToken = tokenRow.access_token;

  // 3) Refresh if expired
  if (new Date(tokenRow.expires_at) <= new Date()) {
    if (!tokenRow.refresh_token) {
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 401 }
      );
    }

    const refreshed = await refreshAccessToken(tokenRow.refresh_token);

    accessToken = refreshed.access_token;

    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000
    ).toISOString();

    await supabase.from("google_tokens").update({
      access_token: accessToken,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
  }

  // 4) Fetch Google Calendar events
  const eventsRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      "?singleEvents=true&orderBy=startTime&timeMin=" +
      new Date().toISOString(),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!eventsRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch Google events" },
      { status: 400 }
    );
  }

  const data = await eventsRes.json();

  // 5) Normalize events
  const events = (data.items as GoogleEvent[]).map((event) => ({
    id: `google-${event.id}`,
    title: event.summary || "(No title)",
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    description: event.description || "",
    location: event.location || "",
  }));

  // 6) Return to frontend
  return NextResponse.json(events);
}
