import { NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getGraphHeaders,
  supabaseAdmin,
} from "@/app/api/outlook/_helpers";

export async function GET(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  const { data: stateRow } = await supabaseAdmin
    .from("calendar_oauth_states")
    .select("user_id, expires_at")
    .eq("state", state)
    .eq("provider", "microsoft")
    .single();

  if (!stateRow) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "State expired" }, { status: 400 });
  }

  const tokenData = await exchangeCodeForToken(code);
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await supabaseAdmin.from("calendar_connections").upsert(
    {
      user_id: stateRow.user_id,
      provider: "microsoft",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scope: tokenData.scope || null,
    },
    { onConflict: "user_id,provider" }
  );

  await supabaseAdmin
    .from("calendar_oauth_states")
    .delete()
    .eq("state", state);

  const headers = getGraphHeaders(tokenData.access_token);
  const defaultCalendar = await fetch("https://graph.microsoft.com/v1.0/me/calendar", {
    headers,
  }).then((res) => (res.ok ? res.json() : null));

  const calendarsResponse = await fetch("https://graph.microsoft.com/v1.0/me/calendars", {
    headers,
  });

  const calendarsJson = calendarsResponse.ok ? await calendarsResponse.json() : { value: [] };
  const calendars = calendarsJson.value || [];
  const defaultCalendarId = defaultCalendar?.id;

  const { data: existingSelections } = await supabaseAdmin
    .from("calendar_calendars")
    .select("calendar_id, selected")
    .eq("user_id", stateRow.user_id)
    .eq("provider", "microsoft");

  const selectionMap = new Map(
    (existingSelections || []).map((item: any) => [item.calendar_id, item.selected])
  );

  const calendarRows = calendars.map((calendar: any) => ({
    user_id: stateRow.user_id,
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

  return NextResponse.redirect(new URL("/settings?outlook=connected", request.url));
}
