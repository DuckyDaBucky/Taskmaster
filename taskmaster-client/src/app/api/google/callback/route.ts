import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new NextResponse("Missing code", { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // 1) Identify logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  // 2) Exchange auth code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    return new NextResponse(`Google token exchange failed: ${errorText}`, {
      status: 400,
    });
  }

  const tokens = await tokenRes.json();

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // 3) Preserve existing refresh token if Google didn't send one
  const { data: existing } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  const refreshTokenToStore =
    tokens.refresh_token ?? existing?.refresh_token ?? null;

  // 4) Store tokens
  const { error: upsertError } = await supabase.from("google_tokens").upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: refreshTokenToStore,
      expires_at: expiresAt.toISOString(),
      scope: tokens.scope ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return new NextResponse(
      `Failed to store Google tokens: ${upsertError.message}`,
      { status: 500 }
    );
  }

  // 5) Redirect back to app
  return NextResponse.redirect(new URL("/calendar", req.url));
}
