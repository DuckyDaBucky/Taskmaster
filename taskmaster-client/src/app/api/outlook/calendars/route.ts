import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  refreshAccessToken,
  getGraphHeaders,
  supabaseAdmin,
} from "@/app/api/outlook/_helpers";

async function getValidAccessToken(userId: string) {
  if (!supabaseAdmin) return null;

  const { data: connection } = await supabaseAdmin
    .from("calendar_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "microsoft")
    .single();

  if (!connection) return null;

  const expiresAt = new Date(connection.expires_at).getTime();
  const now = Date.now() + 60 * 1000;

  if (expiresAt > now) {
    return connection.access_token;
  }

  const tokenData = await refreshAccessToken(connection.refresh_token);
  const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await supabaseAdmin
    .from("calendar_connections")
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || connection.refresh_token,
      expires_at: newExpiresAt,
      scope: tokenData.scope || null,
    })
    .eq("user_id", userId)
    .eq("provider", "microsoft");

  return tokenData.access_token;
}

export async function GET(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  if (refresh) {
    const accessToken = await getValidAccessToken(user.id);
    if (accessToken) {
      const headers = getGraphHeaders(accessToken);
      const defaultCalendar = await fetch(
        "https://graph.microsoft.com/v1.0/me/calendar",
        { headers }
      ).then((res) => (res.ok ? res.json() : null));

      const calendarsResponse = await fetch(
        "https://graph.microsoft.com/v1.0/me/calendars",
        { headers }
      );
      const calendarsJson = calendarsResponse.ok
        ? await calendarsResponse.json()
        : { value: [] };
      const calendars = calendarsJson.value || [];
      const defaultCalendarId = defaultCalendar?.id;

      const { data: existingSelections } = await supabaseAdmin
        .from("calendar_calendars")
        .select("calendar_id, selected")
        .eq("user_id", user.id)
        .eq("provider", "microsoft");

      const selectionMap = new Map(
        (existingSelections || []).map((item: any) => [item.calendar_id, item.selected])
      );

      const calendarRows = calendars.map((calendar: any) => ({
        user_id: user.id,
        provider: "microsoft",
        calendar_id: calendar.id,
        name: calendar.name || "Untitled",
        selected:
          selectionMap.has(calendar.id)
            ? selectionMap.get(calendar.id)
            : defaultCalendarId
            ? calendar.id === defaultCalendarId
            : calendar.name === "Calendar",
      }));

      if (calendarRows.length > 0) {
        await supabaseAdmin.from("calendar_calendars").upsert(calendarRows, {
          onConflict: "user_id,provider,calendar_id",
        });
      }
    }
  }

  const { data: calendars } = await supabaseAdmin
    .from("calendar_calendars")
    .select("calendar_id, name, selected")
    .eq("user_id", user.id)
    .eq("provider", "microsoft")
    .order("name", { ascending: true });

  return NextResponse.json({ calendars: calendars || [] });
}

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const selectedCalendarIds: string[] = body?.selectedCalendarIds || [];

  await supabaseAdmin
    .from("calendar_calendars")
    .update({ selected: false })
    .eq("user_id", user.id)
    .eq("provider", "microsoft");

  if (selectedCalendarIds.length > 0) {
    await supabaseAdmin
      .from("calendar_calendars")
      .update({ selected: true })
      .in("calendar_id", selectedCalendarIds)
      .eq("user_id", user.id)
      .eq("provider", "microsoft");
  }

  return NextResponse.json({ success: true });
}
