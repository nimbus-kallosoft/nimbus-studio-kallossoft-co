import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { nimbusFetch } from "@/lib/nimbus";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const res = await nimbusFetch("/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    return NextResponse.json(
      { error: "Speech synthesis failed" },
      { status: res.status }
    );
  }

  // Stream the audio blob back
  const audioData = await res.arrayBuffer();
  return new Response(audioData, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
    },
  });
}
