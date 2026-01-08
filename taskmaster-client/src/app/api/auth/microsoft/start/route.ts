import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import {
  getMicrosoftAuthorizeUrl,
  supabaseAdmin,
} from "@/app/api/outlook/_helpers";

export async function GET() {
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

  const state = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabaseAdmin.from("calendar_oauth_states").insert({
    user_id: user.id,
    provider: "microsoft",
    state,
    expires_at: expiresAt,
  });

  return NextResponse.redirect(getMicrosoftAuthorizeUrl(state));
}
